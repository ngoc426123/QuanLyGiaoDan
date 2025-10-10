<?php

namespace App\Controllers;

class Person extends BaseController
{
    public function index(): string
    {
        // Mock data cho trang Giáo dân (có thể thay bằng dữ liệu DB sau này)
        $basePeople = [
            ['name' => 'Nguyễn Văn An', 'gender' => 'Nam', 'birth' => '01/01/1990', 'age' => 34],
            ['name' => 'Trần Thị Bình', 'gender' => 'Nữ', 'birth' => '15/03/1985', 'age' => 39],
            ['name' => 'Lê Minh Cường', 'gender' => 'Nam', 'birth' => '22/08/1992', 'age' => 32],
            ['name' => 'Phạm Thị Dung', 'gender' => 'Nữ', 'birth' => '10/12/1988', 'age' => 36],
            ['name' => 'Hoàng Văn Em', 'gender' => 'Nam', 'birth' => '05/07/1995', 'age' => 29],
        ];

        $rowsCount    = 15;
        $totalPeople  = 20; // hiển thị tổng số ví dụ
        $peopleRows   = [];
        for ($i = 0; $i < $rowsCount; $i++) {
            $person              = $basePeople[$i % count($basePeople)];
            $person['id']        = $i + 1;
            // Các ngày bí tích minh hoạ
            $birthDate = \DateTime::createFromFormat('d/m/Y', $person['birth']);
            if ($birthDate instanceof \DateTime) {
                $baptism = (clone $birthDate)->modify('+30 days');
                $person['baptismDate'] = $baptism->format('d/m/Y');
                if ($person['age'] >= 8) {
                    $communion = (clone $birthDate)->modify('+8 years');
                    $person['communionDate'] = $communion->format('d/m/Y');
                }
                if ($person['age'] >= 16) {
                    $confirmation = (clone $birthDate)->modify('+16 years');
                    $person['confirmationDate'] = $confirmation->format('d/m/Y');
                }
                if ($person['age'] >= 25 && $person['id'] % 3 === 0) {
                    $marriage = (clone $birthDate)->modify('+25 years');
                    $person['marriageDate'] = $marriage->format('d/m/Y');
                }
            }
            $peopleRows[] = $person;
        }

        $pageData = [
            'page_title'   => 'Quản lý Giáo dân',
            'peopleRows'   => $peopleRows,
            'total_people' => $totalPeople,
            'display_from' => 1,
            'display_to'   => $rowsCount,
        ];

        return view('Person', $pageData + [
            'activeTab' => 'person',
        ]);
    }
}
