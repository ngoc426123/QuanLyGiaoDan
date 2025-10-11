<?php

namespace App\Controllers;

use App\Models\PersonModel;

class Person extends BaseController
{
    public function index(): string
    {
        // Server-side pagination + DB integration + Filters
        $perPage = 20; // default page size

        // Read filters
        $q       = trim((string) $this->request->getGet('q'));
        $zoneId  = (int) ($this->request->getGet('zone') ?? 0);
        $familyId= (int) ($this->request->getGet('family') ?? 0);
        $sort    = (string) ($this->request->getGet('sort') ?? '');

    $model = new PersonModel();

        // Select only used columns
        $model = $model->select([
            'PID',
            'holy_name',
            'first_name',
            'last_name',
            'gender',
            'date_of_birth',
            'date_RT',
            'date_RL',
            'date_TS',
            'date_HP',
            'date_Dead',
        ]);

        // DB connection
        $db = \Config\Database::connect();

        // Apply search filter (match person fields OR family address/name)
        if ($q !== '') {
            $model = $model->groupStart()
                ->like('first_name', $q)
                ->orLike('last_name', $q)
                ->orLike('holy_name', $q)
                ->orLike('phone', $q)
            ->groupEnd();

            // Find PIDs by family address/name
            $pidAddrRows = $db->table('person_family pf')
                ->select('pf.PID')
                ->join('family f', 'f.FID = pf.FID', 'inner')
                ->groupStart()
                    ->like('f.address', $q)
                    ->orLike('f.name', $q)
                ->groupEnd()
                ->get()->getResultArray();
            $pidAddr = array_map(fn($r) => (int) $r['PID'], $pidAddrRows);
            if (!empty($pidAddr)) {
                $model = $model->orWhereIn('PID', array_values(array_unique($pidAddr)));
            }
        }

        // Filter by zone/family via PID lists to avoid duplicate rows with joins
        if ($zoneId > 0) {
            $pidRows = $db->table('person_zone')->select('PID')->where('ZID', $zoneId)->get()->getResultArray();
            $pids = array_map(fn($r) => (int) $r['PID'], $pidRows);
            if (empty($pids)) { $pids = [-1]; }
            $model = $model->whereIn('PID', $pids);
        }
        if ($familyId > 0) {
            $pidRows = $db->table('person_family')->select('PID')->where('FID', $familyId)->get()->getResultArray();
            $pids = array_map(fn($r) => (int) $r['PID'], $pidRows);
            if (empty($pids)) { $pids = [-1]; }
            $model = $model->whereIn('PID', $pids);
        }

        // Sorting
        switch ($sort) {
            case 'age':
                // Older first (earlier birthdate)
                $model = $model->orderBy('date_of_birth', 'ASC');
                break;
            case 'baptism':
                $model = $model->orderBy('date_RT', 'ASC');
                break;
            case 'name':
            default:
                $model = $model->orderBy('last_name', 'ASC')->orderBy('first_name', 'ASC');
                break;
        }

        // Paginate results
        $rows = $model->paginate($perPage, 'people');
        $pager = $model->pager;
        if ($pager) { $pager->only(['q','zone','family','sort']); }

        $dateFmt = function (?string $date) {
            $date = $date ? trim($date) : '';
            if ($date === '' || $date === '0000-00-00' || $date === '0000-00-00 00:00:00') {
                return null;
            }
            try {
                $dt = new \DateTime($date);
                // Map option format (e.g., dd/mm/yyyy) to PHP DateTime format
                $opt = function_exists('date_format_option') ? date_format_option() : 'dd/mm/yyyy';
                $fmt = 'd/m/Y';
                if ($opt === 'mm/dd/yyyy') {
                    $fmt = 'm/d/Y';
                }
                return $dt->format($fmt);
            } catch (\Throwable $e) {
                return null;
            }
        };

        $calcAge = function (?string $dob) {
            if (!$dob || $dob === '0000-00-00') return null;
            try {
                $birth = new \DateTime($dob);
                $today = new \DateTime();
                return (int)$today->diff($birth)->y;
            } catch (\Throwable $e) {
                return null;
            }
        };

        // Prepare family and zone mappings for current page
        $pids = array_map(fn($r) => (int) $r['PID'], $rows ?: []);
        $familiesByPid = [];
        $zonesByPid = [];
        if (!empty($pids)) {
            $db = \Config\Database::connect();
            // Families
            $pf = $db->table('person_family pf')
                ->select('pf.PID, f.name as family_name, pf.relationship')
                ->join('family f', 'f.FID = pf.FID', 'left')
                ->whereIn('pf.PID', $pids)
                ->get()->getResultArray();

            // Choose best family per PID based on relationship priority
            $relPriority = ['chủ hộ' => 3, 'vợ/chồng' => 2, 'con' => 1];
            foreach ($pf as $row) {
                $pid = (int) $row['PID'];
                $name = (string) ($row['family_name'] ?? '');
                $rel  = mb_strtolower(trim((string) ($row['relationship'] ?? '')));
                $score = $relPriority[$rel] ?? 0;
                if ($name !== '') {
                    if (!isset($familiesByPid[$pid]) || $familiesByPid[$pid]['score'] < $score) {
                        $familiesByPid[$pid] = ['name' => $name, 'score' => $score];
                    }
                }
            }

            // Zones
            $pz = $db->table('person_zone pz')
                ->select('pz.PID, z.name as zone_name')
                ->join('zone z', 'z.ZID = pz.ZID', 'left')
                ->whereIn('pz.PID', $pids)
                ->get()->getResultArray();
            foreach ($pz as $row) {
                $pid = (int) $row['PID'];
                $name = (string) ($row['zone_name'] ?? '');
                if ($name !== '') {
                    $zonesByPid[$pid] = $zonesByPid[$pid] ?? [];
                    if (!in_array($name, $zonesByPid[$pid], true)) {
                        $zonesByPid[$pid][] = $name;
                    }
                }
            }
        }

        $peopleRows = [];
        foreach ($rows as $r) {
            $fullNameParts = [];
            if (!empty($r['holy_name'])) $fullNameParts[] = trim($r['holy_name']);
            // Vietnamese naming often: last_name first
            if (!empty($r['last_name'])) $fullNameParts[] = trim($r['last_name']);
            if (!empty($r['first_name'])) $fullNameParts[] = trim($r['first_name']);
            $displayName = trim(implode(' ', $fullNameParts));

            $genderRaw = $r['gender'] ?? null;
            if ($genderRaw === 1 || $genderRaw === '1') {
                $genderLabel = 'Nam';
            } elseif ($genderRaw === 0 || $genderRaw === '0') {
                $genderLabel = 'Nữ';
            } else {
                $genderLabel = is_string($genderRaw) && $genderRaw !== '' ? $genderRaw : '-';
            }

            $peopleRows[] = [
                'id' => (int)($r['PID'] ?? 0),
                'name' => $displayName ?: ('#' . (int)($r['PID'] ?? 0)),
                'gender' => $genderLabel,
                'birth' => $dateFmt($r['date_of_birth']) ?? '-',
                'age' => $calcAge($r['date_of_birth']) ?? '-',
                'baptismDate' => $dateFmt($r['date_RT']),
                'communionDate' => $dateFmt($r['date_RL']),
                'confirmationDate' => $dateFmt($r['date_TS']),
                'marriageDate' => $dateFmt($r['date_HP']),
                'family' => isset($familiesByPid[(int)$r['PID']]) ? $familiesByPid[(int)$r['PID']]['name'] : null,
                'zones' => !empty($zonesByPid[(int)$r['PID']]) ? implode(', ', $zonesByPid[(int)$r['PID']]) : null,
            ];
        }

        $currentPage = method_exists($pager, 'getCurrentPage') ? $pager->getCurrentPage('people') : (int)($this->request->getGet('page_people') ?? 1);
        $totalPeople = method_exists($pager, 'getTotal') ? (int)$pager->getTotal('people') : (int)($model->pager->getTotal('people') ?? 0);
        $from = $totalPeople > 0 ? (($currentPage - 1) * $perPage + 1) : 0;
        $to = min($currentPage * $perPage, $totalPeople);

        // Dropdown data (basic lists)
        $zonesList = $db->table('zone')->select('ZID, name')->orderBy('name', 'ASC')->get()->getResultArray();
        $familiesList = $db->table('family')->select('FID, name')->orderBy('name', 'ASC')->limit(100)->get()->getResultArray();

        $pageData = [
            'page_title'   => 'Quản lý Giáo dân',
            'peopleRows'   => $peopleRows,
            'total_people' => $totalPeople,
            'display_from' => $from,
            'display_to'   => $to,
            'pager'        => $pager,
            'filters'      => [
                'q' => $q,
                'zone' => $zoneId,
                'family' => $familyId,
                'sort' => $sort,
            ],
            'zones'        => $zonesList,
            'families'     => $familiesList,
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
