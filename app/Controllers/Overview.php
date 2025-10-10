<?php
namespace App\Controllers;

use App\Controllers\BaseController;

class Overview extends BaseController
{
    public function index()
    {
        // Mock data, replace with real queries as needed
        $data = [
            'page_title' => 'Tổng quan hệ thống',
            'activeTab' => 'overview',
            'total_people' => 1200,
            'male' => 550,
            'female' => 650,
            'families' => 320,
            'notes' => 'Hệ thống quản lý giáo dân đang hoạt động ổn định. Dữ liệu được cập nhật thường xuyên. Vui lòng kiểm tra các báo cáo định kỳ để đảm bảo tính chính xác.',
        ];
        return view('Overview', $data);
    }
}