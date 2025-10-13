<?php
namespace App\Controllers;

use App\Controllers\BaseController;

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
            'history' => $history,
        ];
        return view('ImportExport', $data);
    }

    /**
     * POST /import-export/import
     * Handle uploaded CSV/XLSX file and import into selected target (person, family, zone)
     */
    public function import()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        if (! $this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'message' => 'Method not allowed']);
        }
        $target = (string) ($this->request->getPost('target') ?? '');
        $file = $this->request->getFile('file');
        if (! $file || ! $file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'No file uploaded']);
        }

        // For now, support CSV only (simple, reliable). If XLSX support is needed, add PhpSpreadsheet later.
        $ext = strtolower(pathinfo($file->getName(), PATHINFO_EXTENSION));
        if (! in_array($ext, ['csv','xls','xlsx'])) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Unsupported file type']);
        }

        // Move uploaded file to writable/uploads for processing
        $dest = WRITEPATH . 'uploads/import_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $file->move(dirname($dest), basename($dest));

        $imported = 0;
        try {
            if ($ext === 'csv') {
                $fh = fopen($dest, 'r');
                if ($fh) {
                    $header = null;
                    while (($row = fgetcsv($fh)) !== false) {
                        if ($header === null) { $header = $row; continue; }
                        // Minimal import: just count rows. Detailed mapping depends on target and is left to future work.
                        $imported++;
                    }
                    fclose($fh);
                }
            } else {
                // For xls/xlsx, we don't parse here; just report file accepted
                $imported = -1; // unknown rows for binary formats
            }
            return $this->response->setJSON(['ok' => true, 'message' => 'File uploaded', 'imported' => $imported]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'message' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /import-export/export?target=person&format=csv
     * Generate a CSV (or XLSX placeholder) for the selected target
     */
    public function export()
    {
        $target = (string) ($this->request->getGet('target') ?? 'person');
        $format = (string) ($this->request->getGet('format') ?? 'csv');

        $db = db_connect();
        $rows = [];
        $filename = $target . '_export_' . date('Y-m-d') . '.' . $format;

        if ($target === 'person') {
            $rows = $db->table('person')->select('PID, holy_name, first_name, last_name, phone, gender')->orderBy('PID','ASC')->get()->getResultArray();
            $cols = ['PID','holy_name','first_name','last_name','phone','gender'];
        } elseif ($target === 'family') {
            $rows = $db->table('family')->select('FID, name, address')->orderBy('FID','ASC')->get()->getResultArray();
            $cols = ['FID','name','address'];
        } elseif ($target === 'zone') {
            $rows = $db->table('zone')->select('ZID, name, holy_name, note')->orderBy('ZID','ASC')->get()->getResultArray();
            $cols = ['ZID','name','holy_name','note'];
        } else {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Unknown target']);
        }

        if ($format === 'csv') {
            // Stream CSV to browser
            $this->response->setHeader('Content-Type', 'text/csv; charset=utf-8');
            $this->response->setHeader('Content-Disposition', 'attachment; filename="' . $filename . '"');
            $out = fopen('php://output', 'w');
            // write BOM for UTF-8 so Excel handles accents
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

        // For non-csv formats, return not implemented response for now
        return $this->response->setStatusCode(501)->setJSON(['ok' => false, 'message' => 'Format not supported yet']);
    }
}
