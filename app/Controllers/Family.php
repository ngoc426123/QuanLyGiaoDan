<?php

namespace App\Controllers;

class Family extends BaseController
{
    public function index()
    {
        // Sample family data - replace with database query
        $families = [
            [
                'id' => 1,
                'name' => 'Gia đình Nguyễn Văn An',
                'address' => '123 Đường Lê Lợi, Quận 1',
                'members_count' => 4,
                'head_of_family' => 'Nguyễn Văn An',
                'phone' => '0901234567',
                'parish_zone' => 'Giáo khu 1'
            ],
            [
                'id' => 2,
                'name' => 'Gia đình Trần Thị Bình',
                'address' => '456 Đường Nguyễn Huệ, Quận 3',
                'members_count' => 3,
                'head_of_family' => 'Trần Thị Bình',
                'phone' => '0907654321',
                'parish_zone' => 'Giáo khu 2'
            ],
            [
                'id' => 3,
                'name' => 'Gia đình Lê Minh Cường',
                'address' => '789 Đường Pasteur, Quận 1',
                'members_count' => 5,
                'head_of_family' => 'Lê Minh Cường',
                'phone' => '0912345678',
                'parish_zone' => 'Giáo khu 1'
            ],
            [
                'id' => 4,
                'name' => 'Gia đình Phạm Thị Dung',
                'address' => '321 Đường Điện Biên Phủ, Quận 10',
                'members_count' => 2,
                'head_of_family' => 'Phạm Thị Dung',
                'phone' => '0909876543',
                'parish_zone' => 'Giáo khu 3'
            ],
            [
                'id' => 5,
                'name' => 'Gia đình Hoàng Văn Em',
                'address' => '654 Đường Cách Mạng Tháng 8, Quận Tân Bình',
                'members_count' => 6,
                'head_of_family' => 'Hoàng Văn Em',
                'phone' => '0918765432',
                'parish_zone' => 'Giáo khu 2'
            ],
            [
                'id' => 6,
                'name' => 'Gia đình Vũ Thị Giang',
                'address' => '987 Đường Lý Tự Trọng, Quận 1',
                'members_count' => 3,
                'head_of_family' => 'Vũ Thị Giang',
                'phone' => '0903456789',
                'parish_zone' => 'Giáo khu 1'
            ]
        ];

        $pageData = [
            'families' => $families,
            'total_families' => count($families),
            'page_title' => 'Quản lý Gia đình'
        ];

        return view('Family', $pageData + [
            'activeTab' => 'family',
        ]);
    }
}