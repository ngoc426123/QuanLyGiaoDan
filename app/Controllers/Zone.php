<?php

namespace App\Controllers;

class Zone extends BaseController
{
    // POST /zone/{id}/add-family
    public function addFamily($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zid = (int)($id ?? 0);
        if ($zid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã giáo khu.']);
        }
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'message' => 'Phương thức không hợp lệ.']);
        }
        $familyId = (int)($this->request->getPost('family_id') ?? $this->request->getJSON()->family_id ?? 0);
        if ($familyId <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã gia đình.']);
        }
        // (auth gate removed) allow operation without session check

        $db = db_connect();
        // Kiểm tra trùng
        $exists = $db->table('family_zone')->where(['FID' => $familyId, 'ZID' => $zid])->get()->getRowArray();
        if ($exists) {
            return $this->response->setStatusCode(409)->setJSON(['ok' => false, 'message' => 'Gia đình đã thuộc khu này.']);
        }
        // Thêm vào bảng family_zone
        $db->table('family_zone')->insert(['FID' => $familyId, 'ZID' => $zid]);
        // Lấy thông tin chi tiết gia đình vừa thêm
        $family = $db->table('family')->where('FID', $familyId)->get()->getRowArray();

        // Compute updated overview counts for this zone
        $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zid)->get()->getRowArray();
        $familiesCount = (int)($fc['c'] ?? 0);
        $mc = $db->table('person_zone')->select('COUNT(DISTINCT PID) as c')->where('ZID', $zid)->get()->getRowArray();
        $membersCount = (int)($mc['c'] ?? 0);
        $gc = $db->table('person_zone pz')
            ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
            ->join('person p', 'p.PID = pz.PID', 'inner')
            ->where('pz.ZID', $zid)
            ->get()->getRowArray();

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã thêm gia đình vào khu.',
            'family' => [
                'id' => (int)($family['FID'] ?? 0),
                'name' => (string)($family['name'] ?? ''),
                'address' => (string)($family['address'] ?? ''),
            ]
            ,
            'overview' => [
                'families_count' => $familiesCount,
                'members_count' => $membersCount,
                'male' => (int)($gc['male'] ?? 0),
                'female' => (int)($gc['female'] ?? 0),
            ],
        ]);
    }
    // POST /zone/{id}/add-member
    public function addMember($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zid = (int)($id ?? 0);
        if ($zid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã giáo khu.']);
        }
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'message' => 'Phương thức không hợp lệ.']);
        }
        $personId = (int)($this->request->getPost('person_id') ?? $this->request->getJSON()->person_id ?? 0);
        if ($personId <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã giáo dân.']);
        }
        // (auth gate removed) allow operation without session check

        $db = db_connect();
        // Kiểm tra trùng
        $exists = $db->table('person_zone')->where(['PID' => $personId, 'ZID' => $zid])->get()->getRowArray();
        if ($exists) {
            return $this->response->setStatusCode(409)->setJSON(['ok' => false, 'message' => 'Giáo dân đã là thành viên của khu này.']);
        }
        // Thêm vào bảng person_zone
        $db->table('person_zone')->insert(['PID' => $personId, 'ZID' => $zid, 'relationship' => null]);
        // Lấy thông tin chi tiết giáo dân vừa thêm
        $person = $db->table('person')->where('PID', $personId)->get()->getRowArray();
        $vnName = trim(implode(' ', array_filter([
            (string)($person['holy_name'] ?? ''),
            (string)($person['last_name'] ?? ''),
            (string)($person['first_name'] ?? ''),
        ])));
        $genderLabel = ((string)($person['gender'] ?? '') === '1' || (int)($person['gender'] ?? 0) === 1) ? 'Nam' : 'Nữ';
        // Lấy thông tin gia đình (nếu có)
        $pf = $db->table('person_family pf')
            ->select('f.name as family_name')
            ->join('family f', 'f.FID = pf.FID', 'left')
            ->where('pf.PID', $personId)
            ->get()->getRowArray();
        $familyName = (string)($pf['family_name'] ?? '');

        // Compute updated overview for the zone
        $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zid)->get()->getRowArray();
        $familiesCount = (int)($fc['c'] ?? 0);
        $mc = $db->table('person_zone')->select('COUNT(DISTINCT PID) as c')->where('ZID', $zid)->get()->getRowArray();
        $membersCount = (int)($mc['c'] ?? 0);
        $gc = $db->table('person_zone pz')
            ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
            ->join('person p', 'p.PID = pz.PID', 'inner')
            ->where('pz.ZID', $zid)
            ->get()->getRowArray();

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã thêm giáo dân vào khu.',
            'member' => [
                'id' => (int)($person['PID'] ?? 0),
                'name' => $vnName !== '' ? $vnName : ('#' . (int)($person['PID'] ?? 0)),
                'gender' => $genderLabel,
                'phone' => (string)($person['phone'] ?? ''),
                'family' => $familyName,
            ]
            ,
            'overview' => [
                'families_count' => $familiesCount,
                'members_count' => $membersCount,
                'male' => (int)($gc['male'] ?? 0),
                'female' => (int)($gc['female'] ?? 0),
            ],
        ]);
    }
    public function update($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zid = (int) ($id ?? 0);
        if ($zid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Thiếu mã giáo khu.']]);
        }
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'errors' => ['method' => 'Phương thức không hợp lệ.']]);
        }

        $rules = [
            'name' => 'required|min_length[2]|max_length[100]',
            'holy_name' => 'permit_empty|max_length[75]',
            'note' => 'permit_empty|max_length[65535]'
        ];
        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => $this->validator ? $this->validator->getErrors() : ['validate' => 'Dữ liệu không hợp lệ.']
            ]);
        }

        $db = db_connect();
        // Ensure zone exists
        $exists = $db->table('zone')->select('ZID')->where('ZID', $zid)->get()->getRowArray();
        if (!$exists) {
            return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'errors' => ['notfound' => 'Không tìm thấy giáo khu.']]);
        }

        $name = trim((string)$this->request->getPost('name'));
        $holyName = trim((string)$this->request->getPost('holy_name')) ?: null;
        $note = trim((string)$this->request->getPost('note')) ?: null;

        $db->table('zone')->where('ZID', $zid)->update([
            'name' => $name,
            'holy_name' => $holyName,
            'note' => $note,
            'UpdatedAt' => date('Y-m-d H:i:s'),
        ]);

        // Derive leaders for response (may have multiple)
        $lr = $db->table('person_zone pz')
            ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.phone')
            ->join('person p', 'p.PID = pz.PID', 'inner')
            ->where('pz.ZID', $zid)
            ->where('pz.relationship', 'trưởng khu')
            ->get()->getResultArray();
        $leaderList = [];
        foreach ($lr as $p) {
            // Vietnamese order: holy_name + last_name + first_name
            $name = trim(implode(' ', array_filter([
                (string)($p['holy_name'] ?? ''),
                (string)($p['last_name'] ?? ''),
                (string)($p['first_name'] ?? ''),
            ])));
            $leaderList[] = [
                'name' => $name !== '' ? $name : ('#' . (int)($p['PID'] ?? 0)),
                'phone' => (string)($p['phone'] ?? ''),
            ];
        }
        $leaderNames = array_values(array_unique(array_map(fn($r) => (string)($r['name'] ?? ''), $leaderList)));
        $leaderPhones = array_values(array_unique(array_filter(array_map(fn($r) => trim((string)($r['phone'] ?? '')), $leaderList))));
        $leaderName = implode(', ', array_filter($leaderNames));
        $leaderPhone = implode(', ', array_filter($leaderPhones));

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã cập nhật giáo khu.',
            'row' => [
                'id' => $zid,
                'name' => $name,
                'holy_name' => (string)($holyName ?? ''),
                'note' => (string)($note ?? ''),
                'leader' => $leaderName,
                'phone' => $leaderPhone,
                'leaders' => $leaderList,
            ],
        ]);
    }
    public function create()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'errors' => ['method' => 'Phương thức không hợp lệ.']]);
        }

        $rules = [
            'name' => 'required|min_length[2]|max_length[100]',
            'holy_name' => 'permit_empty|max_length[75]',
            'note' => 'permit_empty|max_length[65535]'
        ];
        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => $this->validator ? $this->validator->getErrors() : ['validate' => 'Dữ liệu không hợp lệ.']
            ]);
        }

        $db = db_connect();
        $name = trim((string)$this->request->getPost('name'));
        $holyName = trim((string)$this->request->getPost('holy_name')) ?: null;
        $note = trim((string)$this->request->getPost('note')) ?: null;

        $insert = [ 'name' => $name, 'holy_name' => $holyName, 'note' => $note, 'CreatedAt' => date('Y-m-d H:i:s'), 'UpdatedAt' => date('Y-m-d H:i:s') ];
        $db->table('zone')->insert($insert);
        $zid = (int)$db->insertID();

        // Không có LPID nữa, leader sẽ được xác định qua person_zone.relationship = 'trưởng khu' nếu có.
        $leaderName = '';
        $leaderPhone = '';

        return $this->response->setJSON([
            'ok' => true,
            'message' => 'Đã thêm giáo khu mới.',
            'row' => [
                'id' => $zid,
                'name' => $name,
                'families_count' => 0,
                'members_count' => 0,
                'leader' => $leaderName,
                'phone' => $leaderPhone,
                'address' => '',
                'note' => (string)$note,
            ],
        ]);
    }
    /**
     * POST /zone/{id}/remove-family
     * Gỡ gia đình khỏi giáo khu (xóa bản ghi family_zone)
     */
    public function removeFamily($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zid = (int) ($id ?? 0);
        if ($zid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã giáo khu.']);
        }
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'message' => 'Phương thức không hợp lệ.']);
        }
        $familyId = (int) ($this->request->getPost('family_id') ?? $this->request->getJSON()->family_id ?? 0);
        if ($familyId <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã gia đình.']);
        }
        // (auth gate removed) allow operation without session check

        $db = db_connect();
        try {
            $db->table('family_zone')->where(['FID' => $familyId, 'ZID' => $zid])->delete();

            // compute updated overview
            $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zid)->get()->getRowArray();
            $familiesCount = (int)($fc['c'] ?? 0);
            $mc = $db->table('person_zone')->select('COUNT(DISTINCT PID) as c')->where('ZID', $zid)->get()->getRowArray();
            $membersCount = (int)($mc['c'] ?? 0);
            $gc = $db->table('person_zone pz')
                ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zid)
                ->get()->getRowArray();

            return $this->response->setJSON(['ok' => true, 'message' => 'Đã gỡ gia đình khỏi khu.', 'overview' => [
                'families_count' => $familiesCount,
                'members_count' => $membersCount,
                'male' => (int)($gc['male'] ?? 0),
                'female' => (int)($gc['female'] ?? 0),
            ]]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'message' => 'Không thể gỡ: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /zone/{id}/remove-member/{pid}
     * Gỡ giáo dân khỏi giáo khu
     */
    public function removeMember($id = null, $pid = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zid = (int) ($id ?? 0);
        $personId = (int) ($pid ?? 0);
        if ($zid <= 0 || $personId <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'message' => 'Thiếu mã giáo khu hoặc mã giáo dân.']);
        }
        if (!$this->request->is('post')) {
            return $this->response->setStatusCode(405)->setJSON(['ok' => false, 'message' => 'Phương thức không hợp lệ.']);
        }
        // Require logged in user
        if (! session('user_id')) {
            return $this->response->setStatusCode(401)->setJSON(['ok' => false, 'message' => 'Unauthorized']);
        }

        $db = db_connect();
        try {
            $db->table('person_zone')->where(['PID' => $personId, 'ZID' => $zid])->delete();

            // compute updated overview
            $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zid)->get()->getRowArray();
            $familiesCount = (int)($fc['c'] ?? 0);
            $mc = $db->table('person_zone')->select('COUNT(DISTINCT PID) as c')->where('ZID', $zid)->get()->getRowArray();
            $membersCount = (int)($mc['c'] ?? 0);
            $gc = $db->table('person_zone pz')
                ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zid)
                ->get()->getRowArray();

            return $this->response->setJSON(['ok' => true, 'message' => 'Đã gỡ giáo dân khỏi khu.', 'overview' => [
                'families_count' => $familiesCount,
                'members_count' => $membersCount,
                'male' => (int)($gc['male'] ?? 0),
                'female' => (int)($gc['female'] ?? 0),
            ]]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'message' => 'Không thể gỡ: ' . $e->getMessage()]);
        }
    }
    public function index()
    {
        $db = db_connect();

        // Load all zones
    $zoneRows = $db->table('zone')->select('ZID, name, note')->orderBy('name', 'ASC')->get()->getResultArray();
        if (!$zoneRows) { $zoneRows = []; }

        $zids = array_map(fn($r) => (int) $r['ZID'], $zoneRows);
    // Leader theo person_zone (trưởng khu)

        // Families count per zone
        $familiesByZone = [];
        if (!empty($zids)) {
            $fc = $db->table('family_zone')->select('ZID, COUNT(*) as c')->whereIn('ZID', $zids)->groupBy('ZID')->get()->getResultArray();
            foreach ($fc as $r) { $familiesByZone[(int)$r['ZID']] = (int) $r['c']; }
        }

        // Members count: lấy từ person_zone
        $membersByZone = [];
        if (!empty($zids)) {
            $mc = $db->table('person_zone')
                ->select('ZID, COUNT(DISTINCT PID) as c')
                ->whereIn('ZID', $zids)
                ->groupBy('ZID')
                ->get()->getResultArray();
            foreach ($mc as $r) { $membersByZone[(int)$r['ZID']] = (int) $r['c']; }
        }

        // Lấy tất cả trưởng khu per zone từ person_zone
        $leadersByZone = [];
        if (!empty($zids)) {
            $lr = $db->table('person_zone pz')
                ->select('pz.ZID, p.PID, p.holy_name, p.first_name, p.last_name, p.phone')
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->whereIn('pz.ZID', $zids)
                ->where('pz.relationship', 'trưởng khu')
                ->get()->getResultArray();
            foreach ($lr as $p) {
                $zid = (int)$p['ZID'];
                // Vietnamese order: holy_name + last_name + first_name
                $name = trim(implode(' ', array_filter([
                    (string)($p['holy_name'] ?? ''),
                    (string)($p['last_name'] ?? ''),
                    (string)($p['first_name'] ?? ''),
                ])));
                if (!isset($leadersByZone[$zid])) { $leadersByZone[$zid] = []; }
                $leadersByZone[$zid][] = [
                    'name' => $name !== '' ? $name : ('#' . (int)$p['PID']),
                    'phone' => (string)($p['phone'] ?? ''),
                ];
            }
        }

        // Build zones payload
        $zones = [];
        foreach ($zoneRows as $zr) {
            $zid = (int) $zr['ZID'];
            $leaderList = $leadersByZone[$zid] ?? [];
            $leaderNames = array_values(array_unique(array_map(fn($r) => (string)($r['name'] ?? ''), $leaderList)));
            $leaderPhones = array_values(array_unique(array_filter(array_map(fn($r) => trim((string)($r['phone'] ?? '')), $leaderList))));
            $leaderName = implode(', ', array_filter($leaderNames));
            $leaderPhone = implode(', ', array_filter($leaderPhones));
            $zones[] = [
                'id' => $zid,
                'name' => (string) ($zr['name'] ?? ('#'.$zid)),
                'families_count' => (int) ($familiesByZone[$zid] ?? 0),
                'members_count' => (int) ($membersByZone[$zid] ?? 0),
                'leader' => $leaderName,
                'phone' => $leaderPhone,
                'address' => '', // không có cột địa chỉ cho zone trong schema
                'note' => (string) ($zr['note'] ?? ''),
                'leaders' => $leaderList,
            ];
        }

        // Select default zone
        $zonesMap = [];
        foreach ($zones as $z) { $zonesMap[$z['id']] = $z; }
        $selectedId = (int) ($this->request->getGet('id') ?? 0);
        if ($selectedId === 0 && !empty($zones)) {
            $selectedId = $zones[0]['id'];
        }
        if (!isset($zonesMap[$selectedId]) && !empty($zones)) {
            $selectedId = $zones[0]['id'];
        }

        // Build details for selected zone
        $selectedZone = $zonesMap[$selectedId] ?? null;
        $details = [ 'overview' => [], 'families' => [], 'members' => [], 'events' => [], 'notes' => '' ];
        if ($selectedZone) {
            $zid = $selectedZone['id'];
            // Gender breakdown
            $genderCounts = [ 'male' => 0, 'female' => 0 ];
            $gc = $db->table('person_family pf')
                ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
                ->join('family_zone fz', 'fz.FID = pf.FID', 'inner')
                ->join('person p', 'p.PID = pf.PID', 'inner')
                ->where('fz.ZID', $zid)
                ->get()->getRowArray();
            if ($gc) { $genderCounts['male'] = (int)($gc['male'] ?? 0); $genderCounts['female'] = (int)($gc['female'] ?? 0); }

            $details['overview'] = [
                'families_count' => (int) ($familiesByZone[$zid] ?? 0),
                'members_count' => (int) ($membersByZone[$zid] ?? 0),
                'male' => $genderCounts['male'],
                'female' => $genderCounts['female'],
            ];

            // Families table for this zone
            $families = $db->table('family f')
                ->select('f.FID, f.name, f.address')
                ->join('family_zone fz', 'fz.FID = f.FID', 'inner')
                ->where('fz.ZID', $zid)
                ->orderBy('f.name', 'ASC')
                ->get()->getResultArray();

            $fids = array_map(fn($r) => (int)$r['FID'], $families);
            $membersPerFamily = [];
            $heads = [];
            $phonesByFid = [];
            if (!empty($fids)) {
                // Members count per family
                $mcounts = $db->table('person_family')->select('FID, COUNT(*) as c')->whereIn('FID', $fids)->groupBy('FID')->get()->getResultArray();
                foreach ($mcounts as $r) { $membersPerFamily[(int)$r['FID']] = (int)$r['c']; }

                // Head of family
                $headRows = $db->table('person_family pf')
                    ->select('pf.FID, p.PID, p.holy_name, p.first_name, p.last_name, p.phone')
                    ->join('person p', 'p.PID = pf.PID', 'inner')
                    ->whereIn('pf.FID', $fids)
                    ->where('pf.relationship', 'chủ hộ')
                    ->get()->getResultArray();
                foreach ($headRows as $h) {
                    $fid = (int)$h['FID'];
                    $heads[$fid] = trim(implode(' ', array_filter([(string)($h['holy_name'] ?? ''), (string)($h['first_name'] ?? ''), (string)($h['last_name'] ?? '')])));
                    if (!empty($h['phone'])) { $phonesByFid[$fid] = (string)$h['phone']; }
                }
                // Fallback phone from any member with phone
                $needPhoneFids = array_values(array_diff($fids, array_keys($phonesByFid)));
                if (!empty($needPhoneFids)) {
                    $phoneRows = $db->table('person_family pf')
                        ->select('pf.FID, p.phone')
                        ->join('person p', 'p.PID = pf.PID', 'inner')
                        ->whereIn('pf.FID', $needPhoneFids)
                        ->where("p.phone IS NOT NULL AND p.phone <> ''", null, false)
                        ->groupBy('pf.FID')
                        ->get()->getResultArray();
                    foreach ($phoneRows as $r) { $phonesByFid[(int)$r['FID']] = (string)$r['phone']; }
                }
            }

            $details['families'] = array_map(function($f) use ($membersPerFamily, $heads, $phonesByFid) {
                $fid = (int)$f['FID'];
                return [
                    'id' => $fid,
                    'name' => (string) ($f['name'] ?? ''),
                    'head' => (string) ($heads[$fid] ?? ''),
                    'members' => (int) ($membersPerFamily[$fid] ?? 0),
                    'phone' => (string) ($phonesByFid[$fid] ?? ''),
                    'address' => (string) ($f['address'] ?? ''),
                ];
            }, $families ?? []);

            // Members table for this zone: lấy tất cả giáo dân thuộc khu từ person_zone
            $memberRows = $db->table('person_zone pz')
                ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.gender, p.phone')
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zid)
                ->orderBy('p.last_name', 'ASC')
                ->orderBy('p.first_name', 'ASC')
                ->get()->getResultArray();
            $details['members'] = array_map(function($r){
                $vnName = trim(implode(' ', array_filter([
                    (string)($r['holy_name'] ?? ''),
                    (string)($r['last_name'] ?? ''),
                    (string)($r['first_name'] ?? ''),
                ])));
                $genderLabel = ((string)($r['gender'] ?? '') === '1' || (int)($r['gender'] ?? 0) === 1) ? 'Nam' : 'Nữ';
                return [
                    'id' => (int)($r['PID'] ?? 0),
                    'name' => $vnName !== '' ? $vnName : ('#' . (int)($r['PID'] ?? 0)),
                    'gender' => $genderLabel,
                    'phone' => (string)($r['phone'] ?? ''),
                    'family' => '', // Không lấy thông tin gia đình
                ];
            }, $memberRows ?? []);

            // Notes: from zone.note
            $details['notes'] = (string) ($zonesMap[$zid]['note'] ?? '');
        }

        $pageData = [
            'page_title'     => 'Quản lý Giáo khu',
            'zones'          => $zones,
            'total_zones'    => count($zones),
            'selected_id'    => (int) ($selectedZone['id'] ?? 0),
            'selected_zone'  => $selectedZone,
            'details'        => $details,
        ];

        return view('Zone', $pageData + [ 'activeTab' => 'zone' ]);
    }

    public function detail($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $zoneId = (int) ($id ?? 0);
        if ($zoneId <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Thiếu mã giáo khu.']]);
        }
        $db = db_connect();
        // Load zone basic info
    $zr = $db->table('zone')->select('ZID, name, holy_name, note')->where('ZID', $zoneId)->get()->getRowArray();
        if (!$zr) {
            return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'errors' => ['notfound' => 'Không tìm thấy giáo khu.']]);
        }
        // Leader xác định qua person_zone.relationship = 'trưởng khu' (có thể nhiều người)
        $leaderList = [];
        $lr = $db->table('person_zone pz')
            ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.phone')
            ->join('person p', 'p.PID = pz.PID', 'inner')
            ->where('pz.ZID', $zoneId)
            ->where('pz.relationship', 'trưởng khu')
            ->get()->getResultArray();
        foreach ($lr as $p) {
            // Vietnamese order: holy_name + last_name + first_name
            $name = trim(implode(' ', array_filter([
                (string)($p['holy_name'] ?? ''),
                (string)($p['last_name'] ?? ''),
                (string)($p['first_name'] ?? ''),
            ])));
            $leaderList[] = [
                'name' => $name !== '' ? $name : ('#' . (int)($p['PID'] ?? 0)),
                'phone' => (string)($p['phone'] ?? ''),
            ];
        }
        $leaderNames = array_values(array_unique(array_map(fn($r) => (string)($r['name'] ?? ''), $leaderList)));
        $leaderPhones = array_values(array_unique(array_filter(array_map(fn($r) => trim((string)($r['phone'] ?? '')), $leaderList))));
        $leaderName = implode(', ', array_filter($leaderNames));
        $leaderPhone = implode(', ', array_filter($leaderPhones));

        // Overview: families and members counts + gender
        $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zoneId)->get()->getRowArray();
        $familiesCount = (int)($fc['c'] ?? 0);
        // Đếm số lượng giáo dân trực tiếp từ person_zone
        $mc = $db->table('person_zone')
            ->select('COUNT(DISTINCT PID) as c')
            ->where('ZID', $zoneId)
            ->get()->getRowArray();
        $membersCount = (int)($mc['c'] ?? 0);
        // Đếm nam/nữ trực tiếp từ thành viên person_zone
        $gc = $db->table('person_zone pz')
            ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
            ->join('person p', 'p.PID = pz.PID', 'inner')
            ->where('pz.ZID', $zoneId)
            ->get()->getRowArray();

        // Families table
        $families = $db->table('family f')
            ->select('f.FID, f.name, f.address')
            ->join('family_zone fz', 'fz.FID = f.FID', 'inner')
            ->where('fz.ZID', $zoneId)
            ->orderBy('f.name', 'ASC')
            ->get()->getResultArray();

        $fids = array_map(fn($r) => (int)$r['FID'], $families);
        $membersPerFamily = [];
        $heads = [];
        $phonesByFid = [];
        if (!empty($fids)) {
            $mcounts = $db->table('person_family')->select('FID, COUNT(*) as c')->whereIn('FID', $fids)->groupBy('FID')->get()->getResultArray();
            foreach ($mcounts as $r) { $membersPerFamily[(int)$r['FID']] = (int)$r['c']; }

            $headRows = $db->table('person_family pf')
                ->select('pf.FID, p.holy_name, p.first_name, p.last_name, p.phone')
                ->join('person p', 'p.PID = pf.PID', 'inner')
                ->whereIn('pf.FID', $fids)
                ->where('pf.relationship', 'chủ hộ')
                ->get()->getResultArray();
            foreach ($headRows as $h) {
                $fid = (int)$h['FID'];
                $heads[$fid] = trim(implode(' ', array_filter([(string)($h['holy_name'] ?? ''), (string)($h['first_name'] ?? ''), (string)($h['last_name'] ?? '')])));
                if (!empty($h['phone'])) { $phonesByFid[$fid] = (string)$h['phone']; }
            }
            $needPhoneFids = array_values(array_diff($fids, array_keys($phonesByFid)));
            if (!empty($needPhoneFids)) {
                $phoneRows = $db->table('person_family pf')
                    ->select('pf.FID, p.phone')
                    ->join('person p', 'p.PID = pf.PID', 'inner')
                    ->whereIn('pf.FID', $needPhoneFids)
                    ->where("p.phone IS NOT NULL AND p.phone <> ''", null, false)
                    ->groupBy('pf.FID')
                    ->get()->getResultArray();
                foreach ($phoneRows as $r) { $phonesByFid[(int)$r['FID']] = (string)$r['phone']; }
            }
        }

        $familiesTbl = array_map(function($f) use ($membersPerFamily, $heads, $phonesByFid) {
            $fid = (int)$f['FID'];
            return [
                'id' => $fid,
                'name' => (string) ($f['name'] ?? ''),
                'head' => (string) ($heads[$fid] ?? ''),
                'members' => (int) ($membersPerFamily[$fid] ?? 0),
                'phone' => (string) ($phonesByFid[$fid] ?? ''),
                'address' => (string) ($f['address'] ?? ''),
            ];
        }, $families ?? []);

        // Members for this zone: lấy từ person_zone
        // Sắp xếp theo người thêm mới nhất (giả sử có trường id tự tăng hoặc CreatedAt trong person_zone)
        if ($db->getFieldNames('person_zone') && in_array('CreatedAt', $db->getFieldNames('person_zone'))) {
            $memberRows = $db->table('person_zone pz')
                ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.gender, p.phone, pz.CreatedAt')
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zoneId)
                ->orderBy('pz.CreatedAt', 'DESC')
                ->get()->getResultArray();
        } else if ($db->getFieldNames('person_zone') && in_array('id', $db->getFieldNames('person_zone'))) {
            $memberRows = $db->table('person_zone pz')
                ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.gender, p.phone, pz.id')
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zoneId)
                ->orderBy('pz.id', 'DESC')
                ->get()->getResultArray();
        } else {
            $memberRows = $db->table('person_zone pz')
                ->select('p.PID, p.holy_name, p.first_name, p.last_name, p.gender, p.phone')
                ->join('person p', 'p.PID = pz.PID', 'inner')
                ->where('pz.ZID', $zoneId)
                ->get()->getResultArray();
        }
        $membersTbl = array_map(function($r){
            $vnName = trim(implode(' ', array_filter([
                (string)($r['holy_name'] ?? ''),
                (string)($r['last_name'] ?? ''),
                (string)($r['first_name'] ?? ''),
            ])));
            $genderLabel = ((string)($r['gender'] ?? '') === '1' || (int)($r['gender'] ?? 0) === 1) ? 'Nam' : 'Nữ';
            return [
                'id' => (int)($r['PID'] ?? 0),
                'name' => $vnName !== '' ? $vnName : ('#' . (int)($r['PID'] ?? 0)),
                'gender' => $genderLabel,
                'phone' => (string)($r['phone'] ?? ''),
                'family' => '', // Không lấy thông tin gia đình
            ];
        }, $memberRows ?? []);

        $zonePayload = [
            'id' => (int) $zr['ZID'],
            'name' => (string) ($zr['name'] ?? ('#'.$zoneId)),
            'holy_name' => (string) ($zr['holy_name'] ?? ''),
            'families_count' => $familiesCount,
            'members_count' => $membersCount,
            'leader' => $leaderName,
            'phone' => $leaderPhone,
            'leaders' => $leaderList,
            'address' => '',
        ];

        return $this->response->setJSON([
            'ok' => true,
            'zone' => $zonePayload,
            'details' => [
                'overview' => [
                    'families_count' => $familiesCount,
                    'members_count' => $membersCount,
                    'male' => (int)($gc['male'] ?? 0),
                    'female' => (int)($gc['female'] ?? 0),
                ],
                'families' => $familiesTbl,
                'members' => $membersTbl,
                'notes' => (string) ($zr['note'] ?? ''),
            ],
        ]);
    }
}
