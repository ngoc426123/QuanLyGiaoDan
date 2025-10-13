<?php

namespace App\Controllers;

class Family extends BaseController
{
    // GET /family/search?q=...
    public function search()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $q = trim((string) $this->request->getGet('q'));
        if ($q === '') {
            return $this->response->setJSON(['ok' => true, 'results' => []]);
        }
        $model = new \App\Models\FamilyModel();
        $model = $model->select(['FID', 'name', 'address']);
        $model = $model->groupStart()
            ->like('name', $q)
            ->orLike('address', $q)
            ->groupEnd();
        $rows = $model->orderBy('name', 'ASC')->limit(20)->get()->getResultArray();
        $results = [];
        foreach ($rows as $r) {
            $results[] = [
                'id' => (int)($r['FID'] ?? 0),
                'name' => $r['name'] ?? '',
                'address' => $r['address'] ?? '',
            ];
        }
        return $this->response->setJSON(['ok' => true, 'results' => $results]);
    }
    public function index()
    {
        // Pagination size suggestion: 12 cards/page (3 columns x 4 rows on desktop)
        $perPage = 12;

        $db = \Config\Database::connect();
        $model = new \App\Models\FamilyModel();

        // Filters
        $q = trim((string) $this->request->getGet('q'));
        $zoneId = (int) ($this->request->getGet('zone') ?? 0);
        $sort = (string) ($this->request->getGet('sort') ?? '');

        if ($q !== '') {
            $model = $model->groupStart()
                ->like('name', $q)
                ->orLike('address', $q)
                ->groupEnd();
        }

        // Filter by zone via family_zone
        if ($zoneId > 0) {
            $fidRows = $db->table('family_zone')->select('FID')->where('ZID', $zoneId)->get()->getResultArray();
            $fids = array_map(fn($r) => (int) $r['FID'], $fidRows);
            if (empty($fids)) { $fids = [-1]; }
            $model = $model->whereIn('FID', $fids);
        }

        // Sort
        switch ($sort) {
            case 'name':
                $model = $model->orderBy("REPLACE(REPLACE(name,'Đ','D'),'đ','d')", 'ASC', false);
                break;
            case 'name_desc':
                $model = $model->orderBy("REPLACE(REPLACE(name,'Đ','D'),'đ','d')", 'DESC', false);
                break;
            default:
                $model = $model->orderBy('UpdatedAt', 'DESC')->orderBy('FID', 'DESC');
                break;
        }

        // Paginate families
        $rows = $model->select(['FID','name','address','note','CreatedAt','UpdatedAt'])->paginate($perPage, 'families');
        $pager = $model->pager; if ($pager) { $pager->only(['q','zone','sort']); }

        // Prepare auxiliary data for current page
        $fids = array_map(fn($r) => (int) $r['FID'], $rows ?: []);
        $membersByFid = [];
        $headByFid = [];
        $zoneNamesByFid = [];
        $phonesByFid = [];
        if (!empty($fids)) {
            // Members count
            $pf = $db->table('person_family')
                ->select('FID, COUNT(*) as cnt')
                ->whereIn('FID', $fids)
                ->groupBy('FID')->get()->getResultArray();
            foreach ($pf as $r) { $membersByFid[(int)$r['FID']] = (int)$r['cnt']; }

            // Head of family (relationship like 'chủ hộ'), fetch name + phone
            $heads = $db->table('person_family pf')
                ->select("pf.FID, p.PID, p.holy_name, p.first_name, p.last_name, p.phone, pf.relationship")
                ->join('person p', 'p.PID = pf.PID', 'left')
                ->whereIn('pf.FID', $fids)
                ->where("LOWER(TRIM(pf.relationship)) IN ('chủ hộ','chu ho','chu hộ','chu hộ')", null, false)
                ->get()->getResultArray();
            foreach ($heads as $h) {
                $fid = (int) $h['FID'];
                $name = trim(implode(' ', array_filter([
                    $h['holy_name'] ?? null,
                    $h['last_name'] ?? null,
                    $h['first_name'] ?? null,
                ])));
                if ($name !== '') { $headByFid[$fid] = $name; }
                if (!empty($h['phone'])) { $phonesByFid[$fid] = (string) $h['phone']; }
            }

            // Fallback phone (any member with phone if head not found)
            $needPhoneFids = array_values(array_diff($fids, array_keys($phonesByFid)));
            if (!empty($needPhoneFids)) {
                $phones = $db->table('person_family pf')
                    ->select('pf.FID, p.phone')
                    ->join('person p', 'p.PID = pf.PID', 'left')
                    ->whereIn('pf.FID', $needPhoneFids)
                    ->where("p.phone IS NOT NULL AND p.phone <> ''", null, false)
                    ->groupBy('pf.FID')
                    ->get()->getResultArray();
                foreach ($phones as $r) { $phonesByFid[(int)$r['FID']] = (string) $r['phone']; }
            }

            // Zones
            try {
                $fz = $db->table('family_zone fz')
                    ->select('fz.FID, z.name as zone_name')
                    ->join('zone z', 'z.ZID = fz.ZID', 'left')
                    ->whereIn('fz.FID', $fids)
                    ->get()->getResultArray();
                foreach ($fz as $r) {
                    $fid = (int) $r['FID'];
                    $zn = (string) ($r['zone_name'] ?? '');
                    if ($zn !== '') {
                        $zoneNamesByFid[$fid] = $zoneNamesByFid[$fid] ?? [];
                        if (!in_array($zn, $zoneNamesByFid[$fid], true)) { $zoneNamesByFid[$fid][] = $zn; }
                    }
                }
            } catch (\Throwable $e) {
                // family_zone may not exist in some setups
            }
        }

        $familyCards = [];
        foreach ($rows ?: [] as $r) {
            $fid = (int) $r['FID'];
            $familyCards[] = [
                'id' => $fid,
                'name' => (string) ($r['name'] ?? ''),
                'address' => (string) ($r['address'] ?? ''),
                'members_count' => (int) ($membersByFid[$fid] ?? 0),
                'head_of_family' => (string) ($headByFid[$fid] ?? ''),
                'phone' => (string) ($phonesByFid[$fid] ?? ''),
                'parish_zone' => !empty($zoneNamesByFid[$fid]) ? implode(', ', $zoneNamesByFid[$fid]) : '',
            ];
        }

        // Totals
        $currentPage = method_exists($pager, 'getCurrentPage') ? $pager->getCurrentPage('families') : (int) ($this->request->getGet('page_families') ?? 1);
        $totalFamilies = method_exists($pager, 'getTotal') ? (int) $pager->getTotal('families') : 0;
        $from = $totalFamilies > 0 ? (($currentPage - 1) * $perPage + 1) : 0;
        $to = min($currentPage * $perPage, $totalFamilies);

        // Zones list for filters and modal
        $zonesList = $db->table('zone')->select('ZID, name')->orderBy('name','ASC')->get()->getResultArray();

        $pageData = [
            'families' => $familyCards,
            'total_families' => $totalFamilies,
            'display_from' => $from,
            'display_to' => $to,
            'pager' => $pager,
            'page_title' => 'Quản lý Gia đình',
            'filters' => [
                'q' => $q,
                'zone' => $zoneId,
                'sort' => $sort,
            ],
            'zones' => $zonesList,
            'per_page_suggestion' => $perPage,
        ];

        return view('Family', $pageData + [
            'activeTab' => 'family',
        ]);
    }

    /**
     * POST /family/{id}/remove-zone
     * Gỡ gia đình khỏi mọi liên kết giáo khu
     */
    public function removeZone($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $fid = (int) ($id ?? 0);
        if ($fid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Thiếu mã gia đình.']]);
        }
        // (auth gate removed) allow operation without session check

        $db = \Config\Database::connect();
        try {
            // Determine zones affected
            $zones = [];
            try {
                $rows = $db->table('family_zone')->select('ZID')->where('FID', $fid)->get()->getResultArray();
                foreach ($rows as $r) { $zones[] = (int)($r['ZID'] ?? 0); }
            } catch (\Throwable $e) { /* ignore */ }

            $db->table('family_zone')->where('FID', $fid)->delete();

            // If family belonged to a single zone, compute overview for that zone
            if (count($zones) === 1 && $zones[0] > 0) {
                $zid = $zones[0];
                $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zid)->get()->getRowArray();
                $familiesCount = (int)($fc['c'] ?? 0);
                $mc = $db->table('person_zone')->select('COUNT(DISTINCT PID) as c')->where('ZID', $zid)->get()->getRowArray();
                $membersCount = (int)($mc['c'] ?? 0);
                $gc = $db->table('person_zone pz')
                    ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
                    ->join('person p', 'p.PID = pz.PID', 'inner')
                    ->where('pz.ZID', $zid)
                    ->get()->getRowArray();

                return $this->response->setJSON(['ok' => true, 'message' => 'Đã gỡ gia đình khỏi giáo khu.', 'overview' => [
                    'families_count' => $familiesCount,
                    'members_count' => $membersCount,
                    'male' => (int)($gc['male'] ?? 0),
                    'female' => (int)($gc['female'] ?? 0),
                ]]);
            }

            return $this->response->setJSON(['ok' => true, 'message' => 'Đã gỡ gia đình khỏi giáo khu.']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'errors' => ['server' => 'Không thể gỡ: ' . $e->getMessage()]]);
        }
    }

    public function detail($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $fid = (int) ($id ?? 0);
        if ($fid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Thiếu mã gia đình hợp lệ.']]);
        }
        $db = \Config\Database::connect();
        try {
            $row = $db->table('family')->select('FID, name, address, note')->where('FID', $fid)->get()->getRowArray();
            if (!$row) {
                return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'errors' => ['notfound' => 'Không tìm thấy gia đình.']]);
            }
            $zoneId = null; $zoneName = null;
            try {
                $fz = $db->table('family_zone fz')->select('fz.ZID, z.name as zone_name')->join('zone z','z.ZID=fz.ZID','left')->where('fz.FID',$fid)->get()->getRowArray();
                if ($fz) { $zoneId = (int) ($fz['ZID'] ?? 0); $zoneName = (string) ($fz['zone_name'] ?? ''); }
            } catch (\Throwable $e) {}
            return $this->response->setJSON([
                'ok' => true,
                'row' => [
                    'id' => (int) $row['FID'],
                    'name' => (string) ($row['name'] ?? ''),
                    'address' => (string) ($row['address'] ?? ''),
                    'note' => (string) ($row['note'] ?? ''),
                    'zone_id' => $zoneId,
                    'parish_zone' => $zoneName,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['ok' => false, 'errors' => ['server' => 'Lỗi: ' . $e->getMessage()]]);
        }
    }

    public function update($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $fid = (int) ($id ?? 0);
        if ($fid <= 0) {
            return $this->response->setStatusCode(400)->setJSON(['ok' => false, 'errors' => ['id' => 'Thiếu mã gia đình hợp lệ.']]);
        }
        $rules = [
            'name' => 'required|min_length[2]|max_length[150]',
            'address' => 'required|min_length[2]|max_length[255]',
            'note' => 'permit_empty|max_length[1000]',
            'zone_id' => 'permit_empty|integer',
        ];
        if (! $this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => $this->validator->getErrors(),
            ]);
        }
        $name = trim((string) $this->request->getPost('name'));
        $address = trim((string) $this->request->getPost('address'));
        $note = trim((string) $this->request->getPost('note'));
        $zoneId = (int) ($this->request->getPost('zone_id') ?? 0);

        $db = \Config\Database::connect();
        $db->transBegin();
        try {
            $affected = $db->table('family')->where('FID', $fid)->update([
                'name' => $name,
                'address' => $address !== '' ? $address : null,
                'note' => $note !== '' ? $note : null,
                'UpdatedAt' => date('Y-m-d H:i:s'),
            ]);
            if ($affected === false) { throw new \RuntimeException('Không thể cập nhật.'); }

            $zoneName = null;
            try {
                // Upsert family_zone link to the single selected zone
                $db->table('family_zone')->where('FID', $fid)->delete();
                if ($zoneId > 0) {
                    $db->table('family_zone')->insert(['FID' => $fid, 'ZID' => $zoneId]);
                    $zr = $db->table('zone')->select('name')->where('ZID', $zoneId)->get()->getRowArray();
                    $zoneName = (string) ($zr['name'] ?? '');
                }
            } catch (\Throwable $e) { /* ignore if table missing */ }

            $db->transCommit();
            return $this->response->setJSON([
                'ok' => true,
                'message' => 'Đã cập nhật gia đình.',
                'row' => [
                    'id' => $fid,
                    'name' => $name,
                    'address' => $address,
                    'note' => $note,
                    'parish_zone' => $zoneName,
                ],
            ]);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) { $db->transRollback(); }
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Cập nhật thất bại: ' . $e->getMessage()],
            ]);
        }
    }
    public function create()
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');

        $rules = [
            'name' => 'required|min_length[2]|max_length[150]',
            'address' => 'required|min_length[2]|max_length[255]',
            'note' => 'permit_empty|max_length[1000]',
            'zone_id' => 'permit_empty|integer',
        ];
        if (! $this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'ok' => false,
                'errors' => $this->validator->getErrors(),
            ]);
        }

        $name = trim((string) $this->request->getPost('name'));
    $address = trim((string) $this->request->getPost('address'));
        $note = trim((string) $this->request->getPost('note'));
        $zoneId = (int) ($this->request->getPost('zone_id') ?? 0);

        $db = \Config\Database::connect();
        $db->transBegin();
        try {
            $model = new \App\Models\FamilyModel();
            $model->insert([
                'name' => $name,
                'address' => $address !== '' ? $address : null,
                'note' => $note !== '' ? $note : null,
                'CreatedAt' => date('Y-m-d H:i:s'),
                'UpdatedAt' => date('Y-m-d H:i:s'),
            ]);
            $fid = (int) $model->getInsertID();
            if ($fid <= 0) { throw new \RuntimeException('Không thể tạo gia đình.'); }

            $zoneName = null;
            if ($zoneId > 0) {
                try {
                    $db->table('family_zone')->insert(['FID' => $fid, 'ZID' => $zoneId]);
                    $zr = $db->table('zone')->select('name')->where('ZID', $zoneId)->get()->getRowArray();
                    $zoneName = (string) ($zr['name'] ?? '');
                } catch (\Throwable $e) {
                    // ignore if family_zone not exists
                }
            }

            $db->transCommit();

            return $this->response->setJSON([
                'ok' => true,
                'message' => 'Đã thêm gia đình mới.',
                'row' => [
                    'id' => $fid,
                    'name' => $name,
                    'address' => $address,
                    'members_count' => 0,
                    'head_of_family' => '',
                    'phone' => '',
                    'parish_zone' => $zoneName,
                ],
            ]);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) { $db->transRollback(); }
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Lỗi khi lưu: ' . $e->getMessage()],
            ]);
        }
    }

    public function delete($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $fid = (int) ($id ?? 0);
        if ($fid <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'ok' => false,
                'errors' => ['id' => 'Thiếu mã gia đình hợp lệ.'],
            ]);
        }

        $db = \Config\Database::connect();
        $db->transBegin();
        try {
            // Optionally check constraints: deny deletion if has members
            $hasMembers = $db->table('person_family')->where('FID', $fid)->countAllResults();
            if ($hasMembers > 0) {
                // You can allow cascade by deleting relations, but for safety, block delete by default
                return $this->response->setStatusCode(409)->setJSON([
                    'ok' => false,
                    'errors' => ['conflict' => 'Gia đình còn thành viên, không thể xoá.'],
                ]);
            }

            // Delete zone links if table exists
            try { $db->table('family_zone')->where('FID', $fid)->delete(); } catch (\Throwable $e) { /* ignore */ }

            // Delete family
            $affected = $db->table('family')->where('FID', $fid)->delete();
            if (!$affected) { throw new \RuntimeException('Không tìm thấy gia đình để xoá.'); }

            $db->transCommit();
            return $this->response->setJSON(['ok' => true, 'message' => 'Đã xoá gia đình.']);
        } catch (\Throwable $e) {
            if ($db->transStatus() !== false) { $db->transRollback(); }
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Xoá thất bại: ' . $e->getMessage()],
            ]);
        }
    }

    public function members($id = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $fid = (int) ($id ?? 0);
        if ($fid <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'ok' => false,
                'errors' => ['id' => 'Thiếu mã gia đình hợp lệ.'],
            ]);
        }

        $db = \Config\Database::connect();
        try {
            $rows = $db->table('person_family pf')
                ->select('pf.PID, pf.relationship, p.holy_name, p.first_name, p.last_name, p.phone, p.gender, p.date_of_birth')
                ->join('person p', 'p.PID = pf.PID', 'left')
                ->where('pf.FID', $fid)
                ->orderBy('pf.relationship', 'ASC')
                ->orderBy('p.last_name', 'ASC')
                ->orderBy('p.first_name', 'ASC')
                ->get()->getResultArray();

            $members = [];
            foreach ($rows as $r) {
                $name = trim(implode(' ', array_filter([
                    $r['holy_name'] ?? null,
                    $r['last_name'] ?? null,
                    $r['first_name'] ?? null,
                ])));
                $members[] = [
                    'pid' => (int) ($r['PID'] ?? 0),
                    'name' => $name !== '' ? $name : ('#' . (int) ($r['PID'] ?? 0)),
                    'relationship' => (string) ($r['relationship'] ?? ''),
                    'phone' => (string) ($r['phone'] ?? ''),
                    'gender' => (string) ($r['gender'] ?? ''),
                    'birth' => (string) ($r['date_of_birth'] ?? ''),
                ];
            }

            return $this->response->setJSON([
                'ok' => true,
                'members' => $members,
            ]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Không tải được danh sách: ' . $e->getMessage()],
            ]);
        }
    }

    public function removeMember($fid = null, $pid = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $familyId = (int) ($fid ?? 0);
        $personId = (int) ($pid ?? 0);
        if ($familyId <= 0 || $personId <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'ok' => false,
                'errors' => ['input' => 'Dữ liệu không hợp lệ.'],
            ]);
        }
        $db = \Config\Database::connect();
        try {
            $affected = $db->table('person_family')->where(['FID' => $familyId, 'PID' => $personId])->delete();
            if (!$affected) {
                return $this->response->setStatusCode(404)->setJSON([
                    'ok' => false,
                    'errors' => ['notfound' => 'Không tìm thấy liên kết thành viên trong gia đình.'],
                ]);
            }
            return $this->response->setJSON(['ok' => true, 'message' => 'Đã xoá thành viên khỏi gia đình.']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Xoá thất bại: ' . $e->getMessage()],
            ]);
        }
    }

    public function searchPeople($fid = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $familyId = (int) ($fid ?? 0);
        $q = trim((string) ($this->request->getGet('q') ?? ''));
        if ($q === '') {
            return $this->response->setJSON(['ok' => true, 'results' => []]);
        }
        $db = \Config\Database::connect();
        try {
            // Exclude persons already in this family (if familyId provided)
            $excludePIDs = [];
            if ($familyId > 0) {
                $rows = $db->table('person_family')->select('PID')->where('FID', $familyId)->get()->getResultArray();
                foreach ($rows as $r) { $excludePIDs[] = (int) $r['PID']; }
            }
            $builder = $db->table('person');
            $builder->select('PID, holy_name, first_name, last_name, phone, gender, date_of_birth');
            $builder->groupStart()
                ->like('first_name', $q)
                ->orLike('last_name', $q)
                ->orLike('holy_name', $q)
            ->groupEnd();
            if (!empty($excludePIDs)) { $builder->whereNotIn('PID', $excludePIDs); }
            $builder->orderBy('last_name', 'ASC')->orderBy('first_name', 'ASC')->limit(10);
            $res = $builder->get()->getResultArray();
            $out = [];
            foreach ($res as $p) {
                $name = trim(implode(' ', array_filter([
                    $p['holy_name'] ?? null,
                    $p['last_name'] ?? null,
                    $p['first_name'] ?? null,
                ])));
                $out[] = [
                    'pid' => (int) $p['PID'],
                    'name' => $name !== '' ? $name : ('#' . (int) $p['PID']),
                    'phone' => (string) ($p['phone'] ?? ''),
                    'gender' => (string) ($p['gender'] ?? ''),
                    'birth' => (string) ($p['date_of_birth'] ?? ''),
                ];
            }
            return $this->response->setJSON(['ok' => true, 'results' => $out]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Không thể tìm kiếm: ' . $e->getMessage()],
            ]);
        }
    }

    public function addMember($fid = null)
    {
        $this->response->setHeader('Content-Type', 'application/json; charset=utf-8');
        $familyId = (int) ($fid ?? 0);
        $pid = (int) ($this->request->getPost('pid') ?? 0);
        $relationship = trim((string) ($this->request->getPost('relationship') ?? ''));
        if ($familyId <= 0 || $pid <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'ok' => false,
                'errors' => ['input' => 'Dữ liệu không hợp lệ.'],
            ]);
        }
        $db = \Config\Database::connect();
        try {
            // prevent duplicates
            $exists = $db->table('person_family')->where(['FID' => $familyId, 'PID' => $pid])->countAllResults();
            if ($exists > 0) {
                return $this->response->setStatusCode(409)->setJSON([
                    'ok' => false,
                    'errors' => ['conflict' => 'Thành viên đã thuộc gia đình.'],
                ]);
            }
            $db->table('person_family')->insert([
                'FID' => $familyId,
                'PID' => $pid,
                'relationship' => $relationship !== '' ? $relationship : null,
            ]);
            // fetch minimal person info to return
            $p = $db->table('person')->select('PID, holy_name, first_name, last_name, phone, gender, date_of_birth')->where('PID', $pid)->get()->getRowArray();
            if (!$p) {
                return $this->response->setJSON(['ok' => true, 'message' => 'Đã thêm thành viên.']);
            }
            $name = trim(implode(' ', array_filter([
                $p['holy_name'] ?? null,
                $p['last_name'] ?? null,
                $p['first_name'] ?? null,
            ])));
            return $this->response->setJSON([
                'ok' => true,
                'message' => 'Đã thêm thành viên.',
                'member' => [
                    'pid' => (int) $p['PID'],
                    'name' => $name !== '' ? $name : ('#' . (int) $p['PID']),
                    'phone' => (string) ($p['phone'] ?? ''),
                    'gender' => (string) ($p['gender'] ?? ''),
                    'birth' => (string) ($p['date_of_birth'] ?? ''),
                    'relationship' => $relationship,
                ]
            ]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'ok' => false,
                'errors' => ['server' => 'Không thể thêm: ' . $e->getMessage()],
            ]);
        }
    }
}