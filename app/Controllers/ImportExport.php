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
                // include holy_name and note so we can display zone details in the sheet header
                $zones = $db->table('zone')->select('ZID, name, holy_name, note')->orderBy('ZID','ASC')->get()->getResultArray();
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
                    // Zone info block (professional header): zone title, saint, leader/note
                    $rno = 1;
                    $zoneName = trim((string)($z['name'] ?? ''));
                    $zoneSaint = trim((string)($z['holy_name'] ?? ''));
                    $zoneNote = trim((string)($z['note'] ?? ''));
                    // try to parse a leader name from the note (formats like "Trưởng khu: Name" or "Leader: Name")
                    $leader = '';
                    if (preg_match('/(?:Trưởng\s*khu|Truong\s*khu|Leader)[:\-]\s*(.+)/iu', $zoneNote, $m)) {
                        $leader = trim($m[1]);
                        // remove leader line from note to avoid duplication
                        $zoneNote = trim(preg_replace('/(?:Trưởng\s*khu|Truong\s*khu|Leader)[:\-].*/iu', '', $zoneNote));
                    }
                    // Row 1: Zone title
                    $zsheet->setCellValue('A' . $rno, 'KHU: ' . ($zoneName !== '' ? $zoneName : ('Zone ' . $zid)));
                    $zsheet->mergeCells('A' . $rno . ':I' . $rno);
                    $zsheet->getStyle('A' . $rno)->getFont()->setBold(true)->setSize(14);
                    $zsheet->getStyle('A' . $rno)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $zsheet->getStyle('A' . $rno)->getFill()->applyFromArray(['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E6F0FA']]);
                    $rno++;
                    // Row 2: saint + leader
                    $line2 = [];
                    if ($zoneSaint !== '') { $line2[] = 'Tên thánh: ' . $zoneSaint; }
                    if ($leader !== '') { $line2[] = 'Trưởng khu: ' . $leader; }
                    $zsheet->setCellValue('A' . $rno, implode('    |    ', $line2));
                    $zsheet->mergeCells('A' . $rno . ':I' . $rno);
                    $zsheet->getStyle('A' . $rno)->getFont()->setItalic(true)->setSize(11);
                    $zsheet->getStyle('A' . $rno)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $rno++;
                    // Row 3: optional note (smaller, dim)
                    if ($zoneNote !== '') {
                        $zsheet->setCellValue('A' . $rno, 'Ghi chú: ' . $zoneNote);
                        $zsheet->mergeCells('A' . $rno . ':I' . $rno);
                        $zsheet->getStyle('A' . $rno)->getFont()->setSize(10)->getColor()->setRGB('666666');
                        $zsheet->getStyle('A' . $rno)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                        $rno++;
                    }
                    // small spacer row before table header
                    $rno++;
                    // header (member-only columns) in Vietnamese - dynamic header row
                    $headerRow = $rno;
                    $zsheet->setCellValue('A' . $headerRow, 'Tên thánh');
                    $zsheet->setCellValue('B' . $headerRow, 'Họ và tên');
                    $zsheet->setCellValue('C' . $headerRow, 'Quan hệ');
                    $zsheet->setCellValue('D' . $headerRow, 'Ngày sinh');
                    $zsheet->setCellValue('E' . $headerRow, 'Ngày rửa tội');
                    $zsheet->setCellValue('F' . $headerRow, 'Ngày thêm sức');
                    $zsheet->setCellValue('G' . $headerRow, 'Ngày rước lễ');
                    $zsheet->setCellValue('H' . $headerRow, 'Ngày hôn phối');
                    $zsheet->setCellValue('I' . $headerRow, 'Ghi chú');
                    $rno = $headerRow + 1;
                    $familiesInZone = $db->table('family f')->select('f.FID, f.name, f.address')->join('family_zone fz','fz.FID=f.FID','inner')->where('fz.ZID',$zid)->orderBy('f.name','ASC')->get()->getResultArray();
                    $famIndex = 0;
                    foreach ($familiesInZone as $fam) {
                        $famIndex++;
                        // load members and skip empty families
                        $members = $db->table('person_family pf')
                            ->select('pf.PID, pf.relationship, p.holy_name, p.first_name, p.last_name, p.date_of_birth, p.date_RT, p.date_TS, p.date_RL, p.date_HP, p.note')
                            ->join('person p','p.PID=pf.PID','left')
                            ->where('pf.FID',$fam['FID'])->orderBy('pf.relationship','ASC')->get()->getResultArray();
                        if (empty($members)) {
                            // skip families with no members
                            continue;
                        }
                        // family header merged across A..I (no preceding blank row)
                        $hdrRow = $rno;
                        $hdrText = 'Gia đình: ' . ($fam['name'] ?? '') . ' — ' . ($fam['address'] ?? '');
                        $zsheet->setCellValue('A' . $hdrRow, $hdrText);
                        $zsheet->mergeCells('A' . $hdrRow . ':I' . $hdrRow);
                        $zsheet->getStyle('A' . $hdrRow)->getFont()->setBold(true)->setSize(12);
                        $rno = $hdrRow + 1;
                        // (no per-family repeated header; top header covers all families)
                        // include additional person fields: communion (date_RL), marriage (date_HP), note
                        $members = $db->table('person_family pf')
                            ->select('pf.PID, pf.relationship, p.holy_name, p.first_name, p.last_name, p.date_of_birth, p.date_RT, p.date_TS, p.date_RL, p.date_HP, p.note')
                            ->join('person p','p.PID=pf.PID','left')
                            ->where('pf.FID',$fam['FID'])->orderBy('pf.relationship','ASC')->get()->getResultArray();
                        foreach ($members as $m) {
                            $pid = (int)$m['PID'];
                            $pname = trim(implode(' ', array_filter([ $m['holy_name'] ?? '', $m['last_name'] ?? '', $m['first_name'] ?? '' ])));
                            // Align member row columns with top header A..I (add holy_name before full name)
                            $zsheet->setCellValue('A' . $rno, $m['holy_name'] ?? '');
                            $zsheet->setCellValue('B' . $rno, $pname);
                            $zsheet->setCellValue('C' . $rno, $m['relationship'] ?? '');
                            // write date fields: convert YYYY-MM-DD to Excel date serial where possible
                            $dob = trim((string)($m['date_of_birth'] ?? ''));
                            $bap = trim((string)($m['date_RT'] ?? ''));
                            $conf = trim((string)($m['date_TS'] ?? ''));
                            $comm = trim((string)($m['date_RL'] ?? ''));
                            $mar = trim((string)($m['date_HP'] ?? ''));
                            $note = trim((string)($m['note'] ?? ''));
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
                            if ($dval !== null) { $zsheet->setCellValue('D' . $rno, $dval); }
                            else { $zsheet->setCellValue('D' . $rno, $dob); }
                            $bval = $writeExcelDate($bap);
                            if ($bval !== null) { $zsheet->setCellValue('E' . $rno, $bval); }
                            else { $zsheet->setCellValue('E' . $rno, $bap); }
                            $cval = $writeExcelDate($conf);
                            if ($cval !== null) { $zsheet->setCellValue('F' . $rno, $cval); }
                            else { $zsheet->setCellValue('F' . $rno, $conf); }
                            $rlval = $writeExcelDate($comm);
                            if ($rlval !== null) { $zsheet->setCellValue('G' . $rno, $rlval); }
                            else { $zsheet->setCellValue('G' . $rno, $comm); }
                            $hpval = $writeExcelDate($mar);
                            if ($hpval !== null) { $zsheet->setCellValue('H' . $rno, $hpval); }
                            else { $zsheet->setCellValue('H' . $rno, $mar); }
                            // note column
                            $zsheet->setCellValue('I' . $rno, $note);
                            $rno++;
                        }
                        // apply alternating light-gray fill and draw an outline border for this family's block
                        $blockStart = $hdrRow; // header row index for this family
                        $blockEnd = $rno - 1; // last member row
                        if ($blockStart < 1) { $blockStart = 1; }
                        $range = 'A' . $blockStart . ':I' . $blockEnd;
                        if ($famIndex % 2 === 0) {
                            $zsheet->getStyle($range)->getFill()->applyFromArray([
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F2F2F2'],
                            ]);
                        }
                        // draw gray borders (thin) between cells inside the family block
                        $zsheet->getStyle($range)->applyFromArray([
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => Border::BORDER_THIN,
                                    'color' => ['rgb' => 'BFBFBF'],
                                ],
                            ],
                        ]);
                        // add one blank row to separate families visually (but don't add after last family)
                        // We can't easily detect "last family" here reliably, so only add a blank row if there
                        // will be more content following (rno currently points to next available row).
                        $zsheet->setCellValue('A' . $rno, '');
                        $rno++;
                    }
                    // --- Apply styling for this zone sheet ---
                    $lastRow = max(1, $rno - 1);
                    // header now A..I (member columns) located at $headerRow
                    $headerRange = 'A' . $headerRow . ':I' . $headerRow;
                    // header style: bold, white on blue
                    $zsheet->getStyle($headerRange)->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F75B5']],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    ]);
                    // wrap full name and note columns where appropriate
                    $zsheet->getStyle('B' . $headerRow . ':B' . $lastRow)->getAlignment()->setWrapText(true);
                    $zsheet->getStyle('I' . $headerRow . ':I' . $lastRow)->getAlignment()->setWrapText(true);
                    // autosize columns A..I
                    foreach (range('A', 'I') as $colLetter) {
                        $zsheet->getColumnDimension($colLetter)->setAutoSize(true);
                    }
                    // Apply date format dd/mm/yyyy for date columns D..H (from headerRow+1 to lastRow)
                    $dateRange = 'D' . ($headerRow + 1) . ':H' . $lastRow;
                    $zsheet->getStyle($dateRange)->getNumberFormat()->setFormatCode('dd/mm/yyyy');
                    // freeze header (first row visible after the headerRow)
                    $zsheet->freezePane('A' . ($headerRow + 1));
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
