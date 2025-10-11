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
}
