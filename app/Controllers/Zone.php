<?php

namespace App\Controllers;

class Zone extends BaseController
{
    public function index()
    {
        $db = db_connect();

        // Load all zones
        $zoneRows = $db->table('zone')->select('ZID, name, LPID, note')->orderBy('name', 'ASC')->get()->getResultArray();
        if (!$zoneRows) { $zoneRows = []; }

        $zids = array_map(fn($r) => (int) $r['ZID'], $zoneRows);
        $lpids = array_values(array_unique(array_filter(array_map(fn($r) => (int) ($r['LPID'] ?? 0), $zoneRows))));

        // Families count per zone
        $familiesByZone = [];
        if (!empty($zids)) {
            $fc = $db->table('family_zone')->select('ZID, COUNT(*) as c')->whereIn('ZID', $zids)->groupBy('ZID')->get()->getResultArray();
            foreach ($fc as $r) { $familiesByZone[(int)$r['ZID']] = (int) $r['c']; }
        }

        // Members count (distinct persons in families of the zone)
        $membersByZone = [];
        if (!empty($zids)) {
            $mc = $db->table('person_family pf')
                ->select('fz.ZID, COUNT(DISTINCT pf.PID) as c')
                ->join('family_zone fz', 'fz.FID = pf.FID', 'inner')
                ->whereIn('fz.ZID', $zids)
                ->groupBy('fz.ZID')
                ->get()->getResultArray();
            foreach ($mc as $r) { $membersByZone[(int)$r['ZID']] = (int) $r['c']; }
        }

        // Leader person info
        $leaders = [];
        if (!empty($lpids)) {
            $pr = $db->table('person')->select('PID, holy_name, first_name, last_name, phone')->whereIn('PID', $lpids)->get()->getResultArray();
            foreach ($pr as $p) {
                $name = trim(implode(' ', array_filter([(string)($p['holy_name'] ?? ''), (string)($p['first_name'] ?? ''), (string)($p['last_name'] ?? '')])));
                $leaders[(int)$p['PID']] = [
                    'name' => $name !== '' ? $name : ('#' . (int)$p['PID']),
                    'phone' => (string)($p['phone'] ?? ''),
                ];
            }
        }

        // Build zones payload
        $zones = [];
        foreach ($zoneRows as $zr) {
            $zid = (int) $zr['ZID'];
            $lpid = (int) ($zr['LPID'] ?? 0);
            $leaderName = '';
            $leaderPhone = '';
            if ($lpid && isset($leaders[$lpid])) { $leaderName = $leaders[$lpid]['name']; $leaderPhone = $leaders[$lpid]['phone']; }
            $zones[] = [
                'id' => $zid,
                'name' => (string) ($zr['name'] ?? ('#'.$zid)),
                'families_count' => (int) ($familiesByZone[$zid] ?? 0),
                'members_count' => (int) ($membersByZone[$zid] ?? 0),
                'leader' => $leaderName,
                'phone' => $leaderPhone,
                'address' => '', // không có cột địa chỉ cho zone trong schema
                'note' => (string) ($zr['note'] ?? ''),
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
        $details = [ 'overview' => [], 'families' => [], 'events' => [], 'notes' => '' ];
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
                    'name' => (string) ($f['name'] ?? ''),
                    'head' => (string) ($heads[$fid] ?? ''),
                    'members' => (int) ($membersPerFamily[$fid] ?? 0),
                    'phone' => (string) ($phonesByFid[$fid] ?? ''),
                    'address' => (string) ($f['address'] ?? ''),
                ];
            }, $families ?? []);

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
        $zr = $db->table('zone')->select('ZID, name, LPID, note')->where('ZID', $zoneId)->get()->getRowArray();
        if (!$zr) {
            return $this->response->setStatusCode(404)->setJSON(['ok' => false, 'errors' => ['notfound' => 'Không tìm thấy giáo khu.']]);
        }
        $leaderName = '';
        $leaderPhone = '';
        $lpid = (int) ($zr['LPID'] ?? 0);
        if ($lpid > 0) {
            $p = $db->table('person')->select('holy_name, first_name, last_name, phone')->where('PID', $lpid)->get()->getRowArray();
            if ($p) {
                $leaderName = trim(implode(' ', array_filter([(string)($p['holy_name'] ?? ''), (string)($p['first_name'] ?? ''), (string)($p['last_name'] ?? '')])));
                $leaderPhone = (string) ($p['phone'] ?? '');
            }
        }

        // Overview: families and members counts + gender
        $fc = $db->table('family_zone')->select('COUNT(*) as c')->where('ZID', $zoneId)->get()->getRowArray();
        $familiesCount = (int)($fc['c'] ?? 0);
        $mc = $db->table('person_family pf')
            ->select('COUNT(DISTINCT pf.PID) as c')
            ->join('family_zone fz', 'fz.FID = pf.FID', 'inner')
            ->where('fz.ZID', $zoneId)
            ->get()->getRowArray();
        $membersCount = (int)($mc['c'] ?? 0);
        $gc = $db->table('person_family pf')
            ->select("SUM(CASE WHEN p.gender = 1 THEN 1 ELSE 0 END) as male, SUM(CASE WHEN p.gender IS NOT NULL AND p.gender <> 1 THEN 1 ELSE 0 END) as female", false)
            ->join('family_zone fz', 'fz.FID = pf.FID', 'inner')
            ->join('person p', 'p.PID = pf.PID', 'inner')
            ->where('fz.ZID', $zoneId)
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
                'name' => (string) ($f['name'] ?? ''),
                'head' => (string) ($heads[$fid] ?? ''),
                'members' => (int) ($membersPerFamily[$fid] ?? 0),
                'phone' => (string) ($phonesByFid[$fid] ?? ''),
                'address' => (string) ($f['address'] ?? ''),
            ];
        }, $families ?? []);

        $zonePayload = [
            'id' => (int) $zr['ZID'],
            'name' => (string) ($zr['name'] ?? ('#'.$zoneId)),
            'families_count' => $familiesCount,
            'members_count' => $membersCount,
            'leader' => $leaderName,
            'phone' => $leaderPhone,
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
                'notes' => (string) ($zr['note'] ?? ''),
            ],
        ]);
    }
}
