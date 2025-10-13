<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ImportExport extends BaseController
{
    public function index()
    {
        $history = [
            [
                'time' => date('d/m/Y H:i', strtotime('-2 hours')),
                'type' => 'import',
                'target' => 'Giáo dân',
                'format' => 'xlsx',
                'status' => 'success',
                'note' => 'Nhập 320 dòng từ file people_2025.xlsx'
            ],
            [
                'time' => date('d/m/Y H:i', strtotime('-1 day')),
                'type' => 'export',
                'target' => 'Gia đình',
                'format' => 'csv',
                'status' => 'success',
                'note' => 'Tải về families_backup_2025-10-10.csv'
            ],
            [
                'time' => date('d/m/Y H:i', strtotime('-3 days')),
                'type' => 'import',
                'target' => 'Giáo khu',
                'format' => 'xlsx',
                'status' => 'failed',
                'note' => 'Sai định dạng cột "leader"'
            ],
        ];

        $data = [
            'page_title' => 'Quản lý Nhập/Xuất dữ liệu',
            'activeTab' => 'import-export',
        ];
        // include the sample history for the view
        $data['history'] = $history;

        return view('ImportExport', $data);
    }
                    /*
     * GET /import-export/export?target=person&format=csv
     * Generate a CSV or XLSX for the selected target. When target=all, create one sheet per zone only.
     */
    public function export()
    {
        $target = (string) ($this->request->getGet('target') ?? 'person');
        $format = (string) ($this->request->getGet('format') ?? 'csv');

        // CSV is a single-sheet format. If user requested 'all' (multiple sheets), prefer XLSX.
        if ($target === 'all' && strtolower($format) !== 'xlsx') {
            $format = 'xlsx';
        }

        $db = db_connect();
        $rows = [];
        $filename = $target . '_export_' . date('Y-m-d') . '.' . $format;

        // Prepare row/col list for simple targets; 'all' is handled specially
        if ($target === 'person') {
            $rows = $db->table('person')->select('PID, holy_name, first_name, last_name, phone, gender')->orderBy('PID','ASC')->get()->getResultArray();
            $cols = ['PID','holy_name','first_name','last_name','phone','gender'];
        } elseif ($target === 'family') {
            $rows = $db->table('family')->select('FID, name, address')->orderBy('FID','ASC')->get()->getResultArray();
            $cols = ['FID','name','address'];
        } elseif ($target === 'zone') {
            $rows = $db->table('zone')->select('ZID, name, holy_name, note')->orderBy('ZID','ASC')->get()->getResultArray();
            $cols = ['ZID','name','holy_name','note'];
        } elseif ($target === 'all') {
            // nothing for CSV; XLSX will build per-zone sheets
            $cols = ['dummy'];
        } else {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Unknown target']);
        }

        // CSV export (simple fallback)
        if ($format === 'csv') {
            $this->response->setHeader('Content-Type', 'text/csv; charset=utf-8');
            $this->response->setHeader('Content-Disposition', 'attachment; filename="' . $filename . '"');
            $out = fopen('php://output', 'w');
            echo "\xEF\xBB\xBF"; // BOM
            fputcsv($out, $cols);
            foreach ($rows as $r) {
                $line = [];
                foreach ($cols as $c) { $line[] = $r[$c] ?? ''; }
                fputcsv($out, $line);
            }
            fclose($out);
            return;
        }

        // XLSX export
        if ($format === 'xlsx') {
            if (! class_exists('\PhpOffice\\PhpSpreadsheet\\Spreadsheet')) {
                // fallback to CSV if PhpSpreadsheet missing
                $csvName = preg_replace('/\.xlsx$/i', '.csv', $filename);
                if ($csvName === $filename) { $csvName = preg_replace('/\.[^.]+$/', '.csv', $filename); }
                $this->response->setHeader('Content-Type', 'text/csv; charset=utf-8');
                $this->response->setHeader('Content-Disposition', 'attachment; filename="' . $csvName . '"');
                $out = fopen('php://output', 'w');
                echo "\xEF\xBB\xBF";
                fputcsv($out, $cols);
                foreach ($rows as $r) {
                    $line = [];
                    foreach ($cols as $c) { $line[] = $r[$c] ?? ''; }
                    fputcsv($out, $line);
                }
                fclose($out);
                return;
            }

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

            if ($target === 'all') {
                // Create one sheet per zone only
                $zones = $db->table('zone')->select('ZID, name')->orderBy('ZID','ASC')->get()->getResultArray();
                $usedSheetNames = [];
                $first = true;
                foreach ($zones as $z) {
                    $zid = (int)$z['ZID'];
                    $rawName = $z['name'] ?? ('Zone_' . $zid);
                    $san = preg_replace('/[\\\\\/\?\*\[\]\:]+/u', '-', $rawName);
                    $san = trim($san);
                    if ($san === '') { $san = 'Zone_' . $zid; }
                    $base = mb_substr($san, 0, 31);
                    $candidate = $base;
                    $suffixIndex = 1;
                    while (in_array($candidate, $usedSheetNames, true)) {
                        $suffixIndex++;
                        $suffix = ' (' . $suffixIndex . ')';
                        $maxBaseLen = 31 - mb_strlen($suffix);
                        $candidate = mb_substr($san, 0, max(0, $maxBaseLen)) . $suffix;
                    }
                    $sheetName = $candidate;
                    $usedSheetNames[] = $sheetName;
                    if ($first) {
                        $zsheet = $spreadsheet->getActiveSheet();
                        $first = false;
                    } else {
                        $zsheet = $spreadsheet->createSheet();
                    }
                    $zsheet->setTitle(mb_substr($sheetName, 0, 31));
                    $rno = 1;
                    // header (no ID columns): Family Name, Address, Name, Relationship, Birth/Baptism/Confirmation, Communion, Marriage, Note
                    $zsheet->setCellValue('A' . $rno, 'Family Name');
                    $zsheet->setCellValue('B' . $rno, 'Address');
                    $zsheet->setCellValue('C' . $rno, 'Name');
                    $zsheet->setCellValue('D' . $rno, 'Relationship');
                    $zsheet->setCellValue('E' . $rno, 'Birth Date');
                    $zsheet->setCellValue('F' . $rno, 'Baptism Date');
                    $zsheet->setCellValue('G' . $rno, 'Confirmation Date');
                    $zsheet->setCellValue('H' . $rno, 'Communion Date');
                    $zsheet->setCellValue('I' . $rno, 'Marriage Date');
                    $zsheet->setCellValue('J' . $rno, 'Note');
                    $rno++;
                    $familiesInZone = $db->table('family f')->select('f.FID, f.name, f.address')->join('family_zone fz','fz.FID=f.FID','inner')->where('fz.ZID',$zid)->orderBy('f.name','ASC')->get()->getResultArray();
                    foreach ($familiesInZone as $fam) {
                        // separator (blank row) then family header
                        $zsheet->setCellValue('A' . $rno, '');
                        $rno++;
                        $zsheet->setCellValue('A' . $rno, 'Family:');
                        $zsheet->setCellValue('B' . $rno, $fam['name']);
                        $zsheet->setCellValue('C' . $rno, $fam['address']);
                        // thicker top border to separate families visually (cover current columns A..J)
                        $zsheet->getStyle('A' . $rno . ':J' . $rno)->getBorders()->getTop()->setBorderStyle(Border::BORDER_MEDIUM);
                        $rno++;
                        // (no per-family repeated header; top header covers all families)
                        // include additional person fields: communion (date_RL), marriage (date_HP), note
                        $members = $db->table('person_family pf')
                            ->select('pf.PID, pf.relationship, p.holy_name, p.first_name, p.last_name, p.date_of_birth, p.date_RT, p.date_TS, p.date_RL, p.date_HP, p.note')
                            ->join('person p','p.PID=pf.PID','left')
                            ->where('pf.FID',$fam['FID'])->orderBy('pf.relationship','ASC')->get()->getResultArray();
                        foreach ($members as $m) {
                            $pid = (int)$m['PID'];
                            $pname = trim(implode(' ', array_filter([ $m['holy_name'] ?? '', $m['last_name'] ?? '', $m['first_name'] ?? '' ])));
                            // Align member row columns with top header A..G (no IDs)
                            $zsheet->setCellValue('A' . $rno, $fam['name']);
                            $zsheet->setCellValue('B' . $rno, $fam['address']);
                            $zsheet->setCellValue('C' . $rno, $pname);
                            $zsheet->setCellValue('D' . $rno, $m['relationship'] ?? '');
                            // write date fields: convert YYYY-MM-DD to Excel date serial where possible
                            $dob = trim((string)($m['date_of_birth'] ?? ''));
                            $bap = trim((string)($m['date_RT'] ?? ''));
                            $conf = trim((string)($m['date_TS'] ?? ''));
                            $comm = trim((string)($m['date_RL'] ?? ''));
                            $mar = trim((string)($m['date_HP'] ?? ''));
                            $note = trim((string)($m['note'] ?? ''));
                            // helper: convert ISO date to Excel serial
                            $writeExcelDate = function($val) {
                                if ($val === '' || $val === '0000-00-00') { return null; }
                                // accept YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
                                if (preg_match('/^\d{4}-\d{2}-\d{2}/', $val)) {
                                    try {
                                        $dt = new \DateTime(substr($val,0,10));
                                        return \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel($dt);
                                    } catch (\Throwable $ex) {
                                        return null;
                                    }
                                }
                                return null;
                            };
                            $dval = $writeExcelDate($dob);
                            if ($dval !== null) { $zsheet->setCellValue('E' . $rno, $dval); }
                            else { $zsheet->setCellValue('E' . $rno, $dob); }
                            $bval = $writeExcelDate($bap);
                            if ($bval !== null) { $zsheet->setCellValue('F' . $rno, $bval); }
                            else { $zsheet->setCellValue('F' . $rno, $bap); }
                            $cval = $writeExcelDate($conf);
                            if ($cval !== null) { $zsheet->setCellValue('G' . $rno, $cval); }
                            else { $zsheet->setCellValue('G' . $rno, $conf); }
                            $rlval = $writeExcelDate($comm);
                            if ($rlval !== null) { $zsheet->setCellValue('H' . $rno, $rlval); }
                            else { $zsheet->setCellValue('H' . $rno, $comm); }
                            $hpval = $writeExcelDate($mar);
                            if ($hpval !== null) { $zsheet->setCellValue('I' . $rno, $hpval); }
                            else { $zsheet->setCellValue('I' . $rno, $mar); }
                            // note column
                            $zsheet->setCellValue('J' . $rno, $note);
                            $rno++;
                        }
                    }
                    // --- Apply styling for this zone sheet ---
                    $lastRow = max(1, $rno - 1);
                    // header now A..J (no ID columns)
                    $headerRange = 'A1:J1';
                    // header style: bold, white on blue
                    $zsheet->getStyle($headerRange)->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F75B5']],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    ]);
                    // borders for used range
                    $usedRange = 'A1:J' . $lastRow;
                    $zsheet->getStyle($usedRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                    // wrap addresses, names and note column where appropriate
                    $zsheet->getStyle('B1:B' . $lastRow)->getAlignment()->setWrapText(true);
                    $zsheet->getStyle('C1:C' . $lastRow)->getAlignment()->setWrapText(true);
                    $zsheet->getStyle('J1:J' . $lastRow)->getAlignment()->setWrapText(true);
                    // autosize columns A..J
                    foreach (range('A', 'J') as $colLetter) {
                        $zsheet->getColumnDimension($colLetter)->setAutoSize(true);
                    }
                    // Apply date format dd/mm/yyyy for date columns E..I (from row 2 to lastRow)
                    $dateRange = 'E2:I' . $lastRow;
                    $zsheet->getStyle($dateRange)->getNumberFormat()->setFormatCode('dd/mm/yyyy');
                    // freeze header
                    $zsheet->freezePane('A2');
                }
                if ($first) {
                    $sheet = $spreadsheet->getActiveSheet();
                    $sheet->setTitle('Zones');
                }
            } else {
                // simple single-sheet export (persons/families/zones handled earlier)
                $sheet = $spreadsheet->getActiveSheet();
                $col = 1;
                foreach ($cols as $c) {
                    $cell = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . '1';
                    $sheet->setCellValue($cell, $c);
                }
                $rowNo = 2;
                foreach ($rows as $r) {
                    $col = 1;
                    foreach ($cols as $c) {
                        $cell = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col++) . $rowNo;
                        $sheet->setCellValue($cell, $r[$c] ?? '');
                    }
                    $rowNo++;
                }
                // --- Styling for single-sheet exports ---
                $lastRow = max(1, $rowNo - 1);
                $numCols = count($cols);
                $lastCol = Coordinate::stringFromColumnIndex($numCols);
                $headerRange = 'A1:' . $lastCol . '1';
                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F75B5']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $usedRange = 'A1:' . $lastCol . $lastRow;
                $sheet->getStyle($usedRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                // autosize
                for ($i = 1; $i <= $numCols; $i++) {
                    $colLetter = Coordinate::stringFromColumnIndex($i);
                    $sheet->getColumnDimension($colLetter)->setAutoSize(true);
                }
                // freeze header
                $sheet->freezePane('A2');
            }

            // write and stream
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $tmpDir = is_dir(WRITEPATH . 'uploads') ? WRITEPATH . 'uploads' : sys_get_temp_dir() . DIRECTORY_SEPARATOR;
            $tmpFile = tempnam($tmpDir, 'xlsx_');
            if ($tmpFile === false) {
                return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'message' => 'Cannot create temp file']);
            }
            $tmpXlsx = $tmpFile . '.xlsx';
            if (!rename($tmpFile, $tmpXlsx)) { $tmpXlsx = $tmpFile; }
            $writer->save($tmpXlsx);
            while (ob_get_level()) { ob_end_clean(); }
            header('Content-Description: File Transfer');
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            $xlsxName = preg_replace('/\.csv$/i', '.xlsx', $filename);
            if ($xlsxName === $filename) { $xlsxName = preg_replace('/\.[^.]+$/', '.xlsx', $filename); }
            header('Content-Disposition: attachment; filename="' . basename($xlsxName) . '"');
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($tmpXlsx));
            flush();
            readfile($tmpXlsx);
            @unlink($tmpXlsx);
            exit(0);
        }

        return $this->response->setStatusCode(501)->setJSON(['ok' => false, 'message' => 'Format not supported yet']);
    }
}
