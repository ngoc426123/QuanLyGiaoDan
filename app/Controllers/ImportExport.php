<?php
namespace App\Controllers;

use App\Controllers\BaseController;

class ImportExport extends BaseController
{
    public function index()
    {
        $data = [
            'page_title' => 'Quản lý Nhập/Xuất dữ liệu',
            'activeTab' => 'import-export',
        ];
        return view('ImportExport', $data);
    }
}
