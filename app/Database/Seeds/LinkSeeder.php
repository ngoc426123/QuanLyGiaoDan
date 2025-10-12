<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class LinkSeeder extends Seeder
{
    public function run()
    {
        $persons = $this->db->table('person')->select('PID')->orderBy('PID')->get()->getResultArray();
        $families = $this->db->table('family')->select('FID')->orderBy('FID')->get()->getResultArray();
        $zones = $this->db->table('zone')->select('ZID')->orderBy('ZID')->get()->getResultArray();

        $faker = \Faker\Factory::create('vi_VN');

        // Phân bổ mỗi gia đình 3-6 người (nếu đủ người)
        if ($persons && $families) {
            $pfBatch = [];
            $pIdx = 0;
            foreach ($families as $fi => $f) {
                $members = $faker->numberBetween(3, 6);
                for ($m = 0; $m < $members && $pIdx < count($persons); $m++, $pIdx++) {
                    $rel = $m === 0 ? 'chủ hộ' : ($m === 1 ? 'vợ/chồng' : 'con');
                    $pfBatch[] = [
                        'PID' => $persons[$pIdx]['PID'],
                        'FID' => $f['FID'],
                        'relationship' => $rel,
                        'note' => null,
                    ];
                }
            }
            if (!empty($pfBatch)) {
                $this->db->table('person_family')->insertBatch($pfBatch);
            }
        }

        // Mỗi person thuộc 1-2 zone ngẫu nhiên
        if ($persons && $zones) {
            $pzBatch = [];
            $zids = array_column($zones, 'ZID');
            // Gán người vào 1-2 giáo khu với quan hệ mặc định 'thành viên'
            foreach ($persons as $p) {
                $count = $faker->numberBetween(1, min(2, count($zids)));
                $zPick = (array) $faker->randomElements($zids, $count);
                foreach ($zPick as $zid) {
                    $pzBatch[] = [
                        'PID' => $p['PID'],
                        'ZID' => $zid,
                        'relationship' => 'thành viên',
                        'note' => null,
                    ];
                }
            }

            // Đảm bảo mỗi giáo khu có 1 trưởng khu
            foreach ($zids as $zid) {
                // tìm những PID đã được gán cho giáo khu này trong batch
                $candidates = array_values(array_map(
                    fn($r) => $r['PID'],
                    array_filter($pzBatch, fn($r) => $r['ZID'] === $zid)
                ));
                if (empty($candidates)) {
                    // nếu chưa có ai, chọn ngẫu nhiên một person
                    $randP = $faker->randomElement($persons);
                    $candidates = [$randP['PID']];
                    $pzBatch[] = [
                        'PID' => $randP['PID'],
                        'ZID' => $zid,
                        'relationship' => 'thành viên',
                        'note' => null,
                    ];
                }
                // chọn một người làm trưởng khu
                $leaderPid = $faker->randomElement($candidates);
                $pzBatch[] = [
                    'PID' => $leaderPid,
                    'ZID' => $zid,
                    'relationship' => 'trưởng khu',
                    'note' => null,
                ];
            }

            // Loại bỏ trùng (PID,ZID), ưu tiên giữ 'trưởng khu' nếu có
            $dedup = [];
            foreach ($pzBatch as $row) {
                $key = $row['PID'] . '-' . $row['ZID'];
                if (!isset($dedup[$key])) {
                    $dedup[$key] = $row;
                } else {
                    // nếu một trong hai là trưởng khu thì giữ trưởng khu
                    if (($row['relationship'] ?? '') === 'trưởng khu') {
                        $dedup[$key] = $row;
                    }
                }
            }
            if (!empty($dedup)) {
                $this->db->table('person_zone')->insertBatch(array_values($dedup));
            }
        }

        // Mỗi gia đình thuộc 1 zone ngẫu nhiên
        if ($families && $zones) {
            $fzBatch = [];
            $zids = array_column($zones, 'ZID');
            foreach ($families as $f) {
                $fzBatch[] = [
                    'FID' => $f['FID'],
                    'ZID' => $faker->randomElement($zids),
                    'note' => null,
                ];
            }
            if (!empty($fzBatch)) {
                $this->db->table('family_zone')->insertBatch($fzBatch);
            }
        }
    }
}
