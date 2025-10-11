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

    public function create()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');

        $rules = [
            'full_name'         => 'required|min_length[2]|max_length[100]',
            'gender'            => 'permit_empty|in_list[Nam,Nữ,nam,nữ,Nam ,Nữ ]',
            'birth_year'        => 'permit_empty|regex_match[/^\d{4}$/]',
            'baptism_year'      => 'permit_empty|regex_match[/^\d{4}$/]',
            'communion_year'    => 'permit_empty|regex_match[/^\d{4}$/]',
            'confirmation_year' => 'permit_empty|regex_match[/^\d{4}$/]',
            'marriage_year'     => 'permit_empty|regex_match[/^\d{4}$/]',
            'deceased_year'     => 'permit_empty|regex_match[/^\d{4}$/]',
            'phone'             => 'permit_empty|max_length[20]',
            'zone_id'           => 'permit_empty|integer',
            'notes'             => 'permit_empty|max_length[1000]',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => $this->validator->getErrors(),
            ]);
        }

        $data = [
            'name'   => trim((string) $this->request->getPost('full_name')),
            'gender' => (string) $this->request->getPost('gender'),
            'birth'  => (string) $this->request->getPost('birth_year'),
            'phone'  => (string) $this->request->getPost('phone'),
            'zone'   => (string) $this->request->getPost('zone_id'),
            'notes'  => (string) $this->request->getPost('notes'),
            'sacraments' => [
                'baptism'      => (string) $this->request->getPost('baptism_year'),
                'communion'    => (string) $this->request->getPost('communion_year'),
                'confirmation' => (string) $this->request->getPost('confirmation_year'),
                'marriage'     => (string) $this->request->getPost('marriage_year'),
                'deceased'     => (string) $this->request->getPost('deceased_year'),
            ],
        ];

        // Business rule: deceased_year >= birth_year (if both provided)
        $by = $data['birth'];
        $dy = $data['sacraments']['deceased'] ?? '';
        if ($by && $dy && is_numeric($by) && is_numeric($dy) && (int)$dy < (int)$by) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => ['deceased_year' => 'Năm mất phải lớn hơn hoặc bằng năm sinh.'],
            ]);
        }

        // Mock persistence: write to a log file under writable/logs/person_create.log
        try {
            $line = date('c') . ' | ' . json_encode($data, JSON_UNESCAPED_UNICODE) . PHP_EOL;
            @file_put_contents(WRITEPATH . 'logs/person_create.log', $line, FILE_APPEND);
        } catch (\Throwable $e) {
            // ignore in mock mode
        }

        // Prepare a simple row payload to append on client
        $newRow = [
            'id' => random_int(1000, 9999),
            'name' => $data['name'],
            'gender' => $data['gender'] ?: 'Nam',
            'birth' => $data['birth'] ? ('01/01/' . $data['birth']) : '-',
            'age' => $data['birth'] ? (date('Y') - (int)$data['birth']) : '-',
            'baptismDate' => $data['sacraments']['baptism'] ?: null,
            'communionDate' => $data['sacraments']['communion'] ?: null,
            'confirmationDate' => $data['sacraments']['confirmation'] ?: null,
            'marriageDate' => $data['sacraments']['marriage'] ?: null,
        ];

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã lưu giáo dân (mô phỏng).',
            'row' => $newRow,
        ]);
    }
}
