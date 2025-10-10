<?php

namespace App\Controllers;

class Zone extends BaseController
{
    public function index()
    {
        // Sample zones data (mock). Replace with DB queries later.
        $zones = [
            [
                'id' => 1,
                'name' => 'Giáo khu 1',
                'families_count' => 45,
                'members_count' => 180,
                'leader' => 'Ông Trần Văn Minh',
                'phone' => '0901234561',
                'address' => 'Nhà thờ A, P.1, Q.1',
            ],
            [
                'id' => 2,
                'name' => 'Giáo khu 2',
                'families_count' => 38,
                'members_count' => 152,
                'leader' => 'Bà Nguyễn Thị Hoa',
                'phone' => '0901234562',
                'address' => 'Nhà thờ B, P.5, Q.3',
            ],
            [
                'id' => 3,
                'name' => 'Giáo khu 3',
                'families_count' => 50,
                'members_count' => 205,
                'leader' => 'Ông Phạm Văn Long',
                'phone' => '0901234563',
                'address' => 'Nhà thờ C, P.7, Q.10',
            ],
        ];

        // Map for quick lookup
        $zonesMap = [];
        foreach ($zones as $z) { $zonesMap[$z['id']] = $z; }

        $selectedId = (int) ($this->request->getGet('id') ?? 0);
        if ($selectedId === 0 || !isset($zonesMap[$selectedId])) {
            $selectedId = $zones[0]['id'];
        }

        // Mock details per zone
        $details = [
            1 => [
                'overview' => [
                    'families_count' => 45,
                    'members_count' => 180,
                    'male' => 86,
                    'female' => 94,
                    'children' => 40,
                    'youth' => 55,
                    'adult' => 85,
                ],
                'families' => [
                    ['name' => 'Gia đình Nguyễn Văn An', 'head' => 'Nguyễn Văn An', 'members' => 5, 'phone' => '0901111111', 'address' => '123 Lê Lợi, Q1'],
                    ['name' => 'Gia đình Trần Thị Bình', 'head' => 'Trần Thị Bình', 'members' => 3, 'phone' => '0902222222', 'address' => '456 Nguyễn Huệ, Q3'],
                    ['name' => 'Gia đình Lê Minh Cường', 'head' => 'Lê Minh Cường', 'members' => 4, 'phone' => '0903333333', 'address' => '789 Pasteur, Q1'],
                ],
                'events' => [
                    ['date' => '10/10/2025', 'title' => 'Họp giáo khu định kỳ', 'type' => 'meeting'],
                    ['date' => '15/10/2025', 'title' => 'Bác ái: thăm người bệnh', 'type' => 'charity'],
                    ['date' => '20/10/2025', 'title' => 'Sinh hoạt thiếu nhi', 'type' => 'youth'],
                ],
                'notes' => 'Giáo khu hoạt động đều đặn, cần bổ sung 2 giáo lý viên cho lớp thêm sức.',
            ],
            2 => [
                'overview' => [
                    'families_count' => 38,
                    'members_count' => 152,
                    'male' => 73,
                    'female' => 79,
                    'children' => 32,
                    'youth' => 41,
                    'adult' => 79,
                ],
                'families' => [
                    ['name' => 'Gia đình Phạm Thị Dung', 'head' => 'Phạm Thị Dung', 'members' => 2, 'phone' => '0904444444', 'address' => '321 Điện Biên Phủ, Q10'],
                    ['name' => 'Gia đình Hoàng Văn Em', 'head' => 'Hoàng Văn Em', 'members' => 6, 'phone' => '0905555555', 'address' => '654 CMT8, Tân Bình'],
                ],
                'events' => [
                    ['date' => '12/10/2025', 'title' => 'Vệ sinh khuôn viên', 'type' => 'service'],
                ],
                'notes' => 'Đề xuất tổ chức buổi tĩnh tâm cuối tháng.',
            ],
            3 => [
                'overview' => [
                    'families_count' => 50,
                    'members_count' => 205,
                    'male' => 98,
                    'female' => 107,
                    'children' => 45,
                    'youth' => 60,
                    'adult' => 100,
                ],
                'families' => [
                    ['name' => 'Gia đình Vũ Thị Giang', 'head' => 'Vũ Thị Giang', 'members' => 3, 'phone' => '0906666666', 'address' => '987 Lý Tự Trọng, Q1'],
                ],
                'events' => [
                    ['date' => '18/10/2025', 'title' => 'Tập huấn ca đoàn', 'type' => 'training'],
                ],
                'notes' => 'Cần nâng cấp âm thanh nhà sinh hoạt giáo khu.',
            ],
        ];

        $selectedZone    = $zonesMap[$selectedId];
        $selectedDetails = $details[$selectedId] ?? [
            'overview' => [], 'families' => [], 'events' => [], 'notes' => ''
        ];

        $pageData = [
            'page_title'     => 'Quản lý Giáo khu',
            'zones'          => $zones,
            'total_zones'    => count($zones),
            'selected_id'    => $selectedId,
            'selected_zone'  => $selectedZone,
            'details'        => $selectedDetails,
        ];

        return view('Zone', $pageData + [
            'activeTab' => 'zone',
        ]);
    }
}
