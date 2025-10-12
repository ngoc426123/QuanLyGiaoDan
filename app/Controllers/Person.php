<?php

namespace App\Controllers;

use App\Models\PersonModel;
use App\Models\HistoryModel;

class Person extends BaseController
{
    /**
     * Ghi nhật ký thao tác vào bảng history (không làm hỏng luồng chính nếu lỗi)
     * @param string $type   Phân loại (ví dụ: person)
     * @param string $name   Hành động (create|update|delete)
     * @param array  $content Dữ liệu nội dung (sẽ json_encode)
     */
    private function historyLog(string $type, string $name, array $content): void
    {
        try {
            $model = new HistoryModel();
            $payload = [
                'type'    => mb_substr($type, 0, 10),
                'name'    => mb_substr($name, 0, 25),
                'content' => json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'time'    => date('Y-m-d H:i:s'),
            ];
            $model->insert($payload);
        } catch (\Throwable $e) {
            // ignore logging errors silently
        }
    }
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
            case 'name':
                // Name A-Z using Vietnamese-friendly key for Đ/đ
                $keyAsc = "REPLACE(REPLACE(first_name,'Đ','D'),'đ','d') ASC, REPLACE(REPLACE(last_name,'Đ','D'),'đ','d') ASC";
                $model = $model->orderBy($keyAsc, '', false);
                break;
            case 'name_desc':
                // Name Z-A using Vietnamese-friendly key for Đ/đ
                $keyDesc = "REPLACE(REPLACE(first_name,'Đ','D'),'đ','d') DESC, REPLACE(REPLACE(last_name,'Đ','D'),'đ','d') DESC";
                $model = $model->orderBy($keyDesc, '', false);
                break;
            case 'created_desc':
                $model = $model->orderBy('CreatedAt', 'DESC')->orderBy('PID', 'DESC');
                break;
            default:
                // Default: newest first
                $model = $model->orderBy('CreatedAt', 'DESC')->orderBy('PID', 'DESC');
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
            'holy_name'         => 'permit_empty|max_length[100]',
            'gender'            => 'permit_empty|in_list[Nam,Nữ,nam,nữ,Nam ,Nữ ]',
            // Chấp nhận yyyy hoặc dd/mm/yyyy (hoặc dd-mm-yyyy)
            'birth_year'        => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'baptism_year'      => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'communion_year'    => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'confirmation_year' => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'marriage_year'     => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'deceased_year'     => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'phone'             => 'permit_empty|max_length[20]',
            'zone_id'           => 'permit_empty|integer',
            'family_id'         => 'permit_empty|integer',
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
            'holy_name' => trim((string) $this->request->getPost('holy_name')),
            'gender' => (string) $this->request->getPost('gender'),
            'birth'  => (string) $this->request->getPost('birth_year'),
            'phone'  => (string) $this->request->getPost('phone'),
            'zone'   => (string) $this->request->getPost('zone_id'),
            'family' => (string) $this->request->getPost('family_id'),
            'notes'  => (string) $this->request->getPost('notes'),
            'sacraments' => [
                'baptism'      => (string) $this->request->getPost('baptism_year'),
                'communion'    => (string) $this->request->getPost('communion_year'),
                'confirmation' => (string) $this->request->getPost('confirmation_year'),
                'marriage'     => (string) $this->request->getPost('marriage_year'),
                'deceased'     => (string) $this->request->getPost('deceased_year'),
            ],
        ];

        // Helper: parse year from yyyy or dd/mm/yyyy
        $extractYear = function (?string $val) {
            $s = trim((string) $val);
            if ($s === '') return null;
            if (preg_match('/^\d{4}$/', $s)) return (int) $s;
            if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $s, $m)) return (int) $m[3];
            return null;
        };

        // Business rule: deceased_year >= birth_year (if both provided)
        $by = $extractYear($data['birth']);
        $dy = $extractYear($data['sacraments']['deceased'] ?? '');
        if ($by !== null && $dy !== null && $dy < $by) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => ['deceased_year' => 'Năm mất phải lớn hơn hoặc bằng năm sinh.'],
            ]);
        }

        // Persist to DB using models and transaction
        $db = \Config\Database::connect();
        $db->transBegin();

        // Helper: parse full name into last_name + first_name (last token as first_name)
        $parseName = function(string $full) {
            $full = trim(preg_replace('/\s+/', ' ', $full));
            if ($full === '') return ['last_name' => '', 'first_name' => ''];
            $parts = explode(' ', $full);
            $first = array_pop($parts);
            $last  = trim(implode(' ', $parts));
            return ['last_name' => $last, 'first_name' => $first];
        };
        // Helper: normalize dd/mm/yyyy or dd-mm-yyyy or yyyy to Y-m-d
        $toDate = function (?string $val) {
            $s = trim((string) $val);
            if ($s === '') return null;
            // yyyy
            if (preg_match('/^\d{4}$/', $s)) {
                return $s . '-01-01';
            }
            // dd/mm/yyyy or dd-mm-yyyy
            if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $s, $m)) {
                $d = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                $M = str_pad($m[2], 2, '0', STR_PAD_LEFT);
                $Y = $m[3];
                return "$Y-$M-$d";
            }
            return null;
        };

        $nameParts = $parseName($data['name']);
        $personData = [
            'holy_name'    => $data['holy_name'] ?: null,
            'first_name'   => $nameParts['first_name'] ?: null,
            'last_name'    => $nameParts['last_name'] ?: null,
            'gender'       => $data['gender'] ?: null,
            'date_of_birth'=> $toDate($data['birth']),
            'date_RT'      => $toDate($data['sacraments']['baptism'] ?? ''),
            'date_RL'      => $toDate($data['sacraments']['communion'] ?? ''),
            'date_TS'      => $toDate($data['sacraments']['confirmation'] ?? ''),
            'date_HP'      => $toDate($data['sacraments']['marriage'] ?? ''),
            'date_Dead'    => $toDate($data['sacraments']['deceased'] ?? ''),
            'phone'        => $data['phone'] ?: null,
            'note'         => $data['notes'] ?: null,
            'CreatedAt'    => date('Y-m-d H:i:s'),
            'UpdatedAt'    => date('Y-m-d H:i:s'),
        ];

        try {
            $personModel = new \App\Models\PersonModel();
            $personModel->insert($personData);
            $newId = (int) $personModel->getInsertID();

            if ($newId <= 0) {
                throw new \RuntimeException('Không thể tạo mới giáo dân.');
            }

            // Link zone if provided
            $zid = (int) ($data['zone'] ?: 0);
            $zoneName = null;
            if ($zid > 0) {
                $db->table('person_zone')->insert(['PID' => $newId, 'ZID' => $zid]);
                // Fetch zone display name
                $zrow = $db->table('zone')->select('name')->where('ZID', $zid)->get()->getRowArray();
                $zoneName = (string) ($zrow['name'] ?? '');
            }
            // Link family if provided
            $fid = (int) ($data['family'] ?: 0);
            $familyName = null;
            if ($fid > 0) {
                $rel = trim((string) $this->request->getPost('relationship'));
                $db->table('person_family')->insert([
                    'PID' => $newId,
                    'FID' => $fid,
                    'relationship' => $rel !== '' ? $rel : null,
                ]);
                // Fetch family display name
                $frow = $db->table('family')->select('name')->where('FID', $fid)->get()->getRowArray();
                $familyName = (string) ($frow['name'] ?? '');
            }

            $db->transCommit();

            // Continue to build response with real ID
            $realId = $newId;

            // Audit log
            $actor = [
                'ip' => (string) $this->request->getIPAddress(),
                'ua' => (string) ($this->request->getUserAgent() ? $this->request->getUserAgent()->getAgentString() : ''),
                'user_id' => null,
            ];
            $this->historyLog('person', 'create', [
                'entity' => 'person',
                'pid' => $realId,
                'after' => [
                    'person' => $personData,
                    'zone_id' => $zid ?? null,
                    'family_id' => $fid ?? null,
                    'relationship' => isset($rel) ? $rel : null,
                ],
                'by' => $actor,
            ]);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) {
                $db->transRollback();
            }
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Lỗi khi lưu dữ liệu: ' . $e->getMessage()],
            ]);
        }

        // Prepare a simple row payload to append on client
        // Tính tuổi từ ngày sinh (nếu có)
        $age = '-';
        $birthDisplay = '-';
        if ($data['birth'] !== '') {
            $birthStr = $data['birth'];
            $y = $extractYear($birthStr);
            if ($y) {
                // Chuẩn hóa hiển thị dd/mm/yyyy
                if (preg_match('/^\d{4}$/', $birthStr)) {
                    $birthDisplay = '01/01/' . $y;
                } elseif (preg_match('/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/', $birthStr)) {
                    // đổi - thành /
                    $birthDisplay = str_replace('-', '/', $birthStr);
                }
                try {
                    $dob = \DateTime::createFromFormat('d/m/Y', $birthDisplay);
                    if ($dob) {
                        $today = new \DateTime();
                        $age = (int) $today->diff($dob)->y;
                    } else {
                        $age = date('Y') - $y;
                    }
                } catch (\Throwable $e) {
                    $age = date('Y') - $y;
                }
            }
        }

        $displayName = trim(($data['holy_name'] ? ($data['holy_name'] . ' ') : '') . $data['name']);

        $newRow = [
            'id' => $realId,
            'name' => $displayName,
            'gender' => $data['gender'] ?: 'Nam',
            'birth' => $birthDisplay,
            'age' => $age,
            'baptismDate' => $data['sacraments']['baptism'] ?: null,
            'communionDate' => $data['sacraments']['communion'] ?: null,
            'confirmationDate' => $data['sacraments']['confirmation'] ?: null,
            'marriageDate' => $data['sacraments']['marriage'] ?: null,
            'family' => isset($familyName) ? ($familyName ?: null) : null,
            'zones' => isset($zoneName) ? ($zoneName ?: null) : null,
        ];

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã lưu giáo dân thành công.',
            'row' => $newRow,
        ]);
    }

    // AJAX: trả danh sách gia đình theo giáo khu (nếu có)
    public function families()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zoneId = (int) ($this->request->getGet('zone_id') ?? 0);
        $limit  = (int) ($this->request->getGet('limit') ?? 500);
        if ($limit <= 0 || $limit > 2000) { $limit = 500; }

        $db = \Config\Database::connect();
        try {
            if ($zoneId > 0) {
                // Ưu tiên bảng family_zone nếu có để lọc theo giáo khu
                $rows = $db->table('family f')
                    ->select('f.FID, f.name')
                    ->join('family_zone fz', 'fz.FID = f.FID', 'inner')
                    ->where('fz.ZID', $zoneId)
                    ->orderBy('f.name', 'ASC')
                    ->limit($limit)
                    ->get()->getResultArray();
            } else {
                $rows = $db->table('family')->select('FID, name')->orderBy('name','ASC')->limit($limit)->get()->getResultArray();
            }
        } catch (\Throwable $e) {
            // Fallback: nếu join lỗi (bảng family_zone không tồn tại) thì trả tất cả gia đình
            $rows = $db->table('family')->select('FID, name')->orderBy('name','ASC')->limit($limit)->get()->getResultArray();
        }

        return $this->response->setJSON([
            'ok' => true,
            'families' => array_map(function($r){
                return [
                    'id' => (int)($r['FID'] ?? 0),
                    'name' => (string)($r['name'] ?? ''),
                ];
            }, $rows ?: []),
        ]);
    }

    // GET /person/{id} - detail
    public function detail($id)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $pid = (int) $id;
        if ($pid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'error' => 'Invalid ID']);
        }

        $db = \Config\Database::connect();
        $person = $db->table('person')->where('PID', $pid)->get()->getRowArray();
        if (!$person) {
            return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'error' => 'Not found']);
        }

        // Format dates as d/m/Y when valid
        $fmt = function($date){
            if (!$date || $date === '0000-00-00' || $date === '0000-00-00 00:00:00') return null;
            try { $dt = new \DateTime($date); return $dt->format('d/m/Y'); } catch (\Throwable $e) { return null; }
        };
        $age = null;
        if (!empty($person['date_of_birth']) && $person['date_of_birth'] !== '0000-00-00'){
            try { $age = (new \DateTime())->diff(new \DateTime($person['date_of_birth']))->y; } catch (\Throwable $e) { $age = null; }
        }

        $families = $db->table('person_family pf')
            ->select('pf.FID, f.name as family_name, f.address as family_address, pf.relationship')
            ->join('family f', 'f.FID = pf.FID', 'left')
            ->where('pf.PID', $pid)
            ->get()->getResultArray();
        $zones = $db->table('person_zone pz')
            ->select('pz.ZID, z.name as zone_name, z.holy_name as zone_holy_name, z.LPID')
            ->join('zone z', 'z.ZID = pz.ZID', 'left')
            ->where('pz.PID', $pid)
            ->get()->getResultArray();

        // Normalize gender for display
        $genderRaw = $person['gender'] ?? null;
        if ($genderRaw === 1 || $genderRaw === '1') {
            $genderLabel = 'Nam';
        } elseif ($genderRaw === 0 || $genderRaw === '0') {
            $genderLabel = 'Nữ';
        } else {
            $genderLabel = (is_string($genderRaw) && $genderRaw !== '') ? (string)$genderRaw : '-';
        }

        $payload = [
            'ok' => true,
            'person' => array_merge($person, [
                'date_of_birth_fmt' => $fmt($person['date_of_birth'] ?? null),
                'date_RT_fmt' => $fmt($person['date_RT'] ?? null),
                'date_RL_fmt' => $fmt($person['date_RL'] ?? null),
                'date_TS_fmt' => $fmt($person['date_TS'] ?? null),
                'date_HP_fmt' => $fmt($person['date_HP'] ?? null),
                'date_Dead_fmt' => $fmt($person['date_Dead'] ?? null),
                'age' => $age,
                'gender_label' => $genderLabel,
                'full_name' => trim(implode(' ', array_filter([
                    $person['holy_name'] ?? null,
                    $person['last_name'] ?? null,
                    $person['first_name'] ?? null,
                ]))),
            ]),
            'families' => $families,
            'zones' => $zones,
        ];

        return $this->response->setJSON($payload);
    }

    // POST /person/{id}/delete - delete person and relations
    public function delete($id)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $pid = (int) $id;
        if ($pid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'error' => 'Invalid ID']);
        }

        $db = \Config\Database::connect();
        $db->transBegin();
        try {
            // Ensure exists
            $exists = $db->table('person')->where('PID', $pid)->get()->getRowArray();
            if (!$exists) {
                $db->transRollback();
                return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'error' => 'Not found']);
            }
            // Snapshot before
            $before = $exists;
            $before['families'] = $db->table('person_family')->where('PID', $pid)->get()->getResultArray();
            $before['zones']    = $db->table('person_zone')->where('PID', $pid)->get()->getResultArray();
            // Delete links
            $db->table('person_family')->where('PID', $pid)->delete();
            $db->table('person_zone')->where('PID', $pid)->delete();
            // Delete person
            $db->table('person')->where('PID', $pid)->delete();
            $db->transCommit();

            // Audit log
            $actor = [
                'ip' => (string) $this->request->getIPAddress(),
                'ua' => (string) ($this->request->getUserAgent() ? $this->request->getUserAgent()->getAgentString() : ''),
                'user_id' => null,
            ];
            $this->historyLog('person', 'delete', [
                'entity' => 'person',
                'pid' => $pid,
                'before' => $before,
                'after' => null,
                'by' => $actor,
            ]);
            return $this->response->setJSON(['ok' => true]);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) $db->transRollback();
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'error' => 'Delete failed: '.$e->getMessage()]);
        }
    }

    // POST /person/{id}/update - update basic info and sacraments, zone and family
    public function update($id)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $pid = (int) $id;
        if ($pid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Invalid ID']]);
        }

        $rules = [
            'full_name'         => 'required|min_length[2]|max_length[100]',
            'holy_name'         => 'permit_empty|max_length[100]',
            'gender'            => 'permit_empty|in_list[Nam,Nữ,nam,nữ,Nam ,Nữ ]',
            'birth_year'        => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'baptism_year'      => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'communion_year'    => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'confirmation_year' => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'marriage_year'     => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'deceased_year'     => 'permit_empty|regex_match[/^(\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})$/]',
            'phone'             => 'permit_empty|max_length[20]',
            'zone_id'           => 'permit_empty|integer',
            'family_id'         => 'permit_empty|integer',
            'relationship'      => 'permit_empty|max_length[100]',
            'notes'             => 'permit_empty|max_length[1000]',
        ];
        if (! $this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON(['ok' => false, 'errors' => $this->validator->getErrors()]);
        }

        $data = [
            'name'   => trim((string) $this->request->getPost('full_name')),
            'holy_name' => trim((string) $this->request->getPost('holy_name')),
            'gender' => (string) $this->request->getPost('gender'),
            'birth'  => (string) $this->request->getPost('birth_year'),
            'phone'  => (string) $this->request->getPost('phone'),
            'zone'   => (string) $this->request->getPost('zone_id'),
            'family' => (string) $this->request->getPost('family_id'),
            'relationship' => (string) $this->request->getPost('relationship'),
            'notes'  => (string) $this->request->getPost('notes'),
            'sacraments' => [
                'baptism'      => (string) $this->request->getPost('baptism_year'),
                'communion'    => (string) $this->request->getPost('communion_year'),
                'confirmation' => (string) $this->request->getPost('confirmation_year'),
                'marriage'     => (string) $this->request->getPost('marriage_year'),
                'deceased'     => (string) $this->request->getPost('deceased_year'),
            ],
        ];

        // Helper: extract year from yyyy or dd/mm/yyyy
        $extractYear = function (?string $val) {
            $s = trim((string) $val);
            if ($s === '') return null;
            if (preg_match('/^\d{4}$/', $s)) return (int) $s;
            if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $s, $m)) return (int) $m[3];
            return null;
        };
        $by = $extractYear($data['birth']);
        $dy = $extractYear($data['sacraments']['deceased'] ?? '');
        if ($by !== null && $dy !== null && $dy < $by) {
            return $this->response->setStatusCode(422)->setJSON(['ok' => false, 'errors' => ['deceased_year' => 'Năm mất phải lớn hơn hoặc bằng năm sinh.']]);
        }

        $db = \Config\Database::connect();
        $db->transBegin();

        $parseName = function(string $full) {
            $full = trim(preg_replace('/\s+/', ' ', $full));
            if ($full === '') return ['last_name' => '', 'first_name' => ''];
            $parts = explode(' ', $full);
            $first = array_pop($parts);
            $last  = trim(implode(' ', $parts));
            return ['last_name' => $last, 'first_name' => $first];
        };
        $toDate = function (?string $val) {
            $s = trim((string) $val);
            if ($s === '') return null;
            if (preg_match('/^\d{4}$/', $s)) { return $s . '-01-01'; }
            if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $s, $m)) {
                $d = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                $M = str_pad($m[2], 2, '0', STR_PAD_LEFT);
                $Y = $m[3];
                return "$Y-$M-$d";
            }
            return null;
        };

        try {
            // Ensure exists
            $exists = $db->table('person')->where('PID', $pid)->get()->getRowArray();
            if (!$exists) {
                $db->transRollback();
                return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'errors' => ['id' => 'Not found']]);
            }
            // Snapshot before
            $before = $exists;
            $before['families'] = $db->table('person_family')->where('PID', $pid)->get()->getResultArray();
            $before['zones']    = $db->table('person_zone')->where('PID', $pid)->get()->getResultArray();

            $nameParts = $parseName($data['name']);
            $personData = [
                'holy_name'    => $data['holy_name'] ?: null,
                'first_name'   => $nameParts['first_name'] ?: null,
                'last_name'    => $nameParts['last_name'] ?: null,
                'gender'       => $data['gender'] ?: null,
                'date_of_birth'=> $toDate($data['birth']),
                'date_RT'      => $toDate($data['sacraments']['baptism'] ?? ''),
                'date_RL'      => $toDate($data['sacraments']['communion'] ?? ''),
                'date_TS'      => $toDate($data['sacraments']['confirmation'] ?? ''),
                'date_HP'      => $toDate($data['sacraments']['marriage'] ?? ''),
                'date_Dead'    => $toDate($data['sacraments']['deceased'] ?? ''),
                'phone'        => $data['phone'] ?: null,
                'note'         => $data['notes'] ?: null,
                'UpdatedAt'    => date('Y-m-d H:i:s'),
            ];
            $db->table('person')->where('PID', $pid)->update($personData);

            // Update zone link (replace simple)
            $zid = (int) ($data['zone'] ?: 0);
            $db->table('person_zone')->where('PID', $pid)->delete();
            if ($zid > 0) { $db->table('person_zone')->insert(['PID' => $pid, 'ZID' => $zid]); }

            // Update family link
            $fid = (int) ($data['family'] ?: 0);
            $db->table('person_family')->where('PID', $pid)->delete();
            if ($fid > 0) {
                $rel = trim((string) $data['relationship']);
                $db->table('person_family')->insert(['PID' => $pid, 'FID' => $fid, 'relationship' => $rel !== '' ? $rel : null]);
            }

            $db->transCommit();

            // Snapshot after
            $afterPerson = $db->table('person')->where('PID', $pid)->get()->getRowArray();
            $after = $afterPerson ?: [];
            $after['families'] = $db->table('person_family')->where('PID', $pid)->get()->getResultArray();
            $after['zones']    = $db->table('person_zone')->where('PID', $pid)->get()->getResultArray();

            // Audit log
            $actor = [
                'ip' => (string) $this->request->getIPAddress(),
                'ua' => (string) ($this->request->getUserAgent() ? $this->request->getUserAgent()->getAgentString() : ''),
                'user_id' => null,
            ];
            $this->historyLog('person', 'update', [
                'entity' => 'person',
                'pid' => $pid,
                'before' => $before,
                'after' => $after,
                'by' => $actor,
            ]);

            // Build minimal row info to update UI
            $displayName = trim(($data['holy_name'] ? ($data['holy_name'] . ' ') : '') . $data['name']);
            $newRow = [
                'id' => $pid,
                'name' => $displayName,
                'gender' => $data['gender'] ?: 'Nam',
                'birth' => $data['birth'] ?: '-',
                'baptismDate' => $data['sacraments']['baptism'] ?: null,
                'communionDate' => $data['sacraments']['communion'] ?: null,
                'confirmationDate' => $data['sacraments']['confirmation'] ?: null,
                'marriageDate' => $data['sacraments']['marriage'] ?: null,
                'family' => null,
                'zones' => null,
            ];

            // Fetch names for immediate UI display
            if ($zid > 0) {
                $zrow = $db->table('zone')->select('name')->where('ZID', $zid)->get()->getRowArray();
                $newRow['zones'] = (string) ($zrow['name'] ?? '');
            }
            if ($fid > 0) {
                $frow = $db->table('family')->select('name')->where('FID', $fid)->get()->getRowArray();
                $newRow['family'] = (string) ($frow['name'] ?? '');
            }

            return $this->response->setJSON(['ok' => true, 'message' => 'Cập nhật thành công.', 'row' => $newRow]);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) $db->transRollback();
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'errors' => ['server' => 'Lỗi khi cập nhật: ' . $e->getMessage()]]);
        }
    }
}
