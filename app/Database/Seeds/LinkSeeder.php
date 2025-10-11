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
            foreach ($persons as $p) {
                $count = $faker->numberBetween(1, min(2, count($zones)));
                $zPick = (array) $faker->randomElements(array_column($zones, 'ZID'), $count);
                foreach ($zPick as $zid) {
                    $pzBatch[] = [
                        'PID' => $p['PID'],
                        'ZID' => $zid,
                        'note' => null,
                    ];
                }
            }
            // Loại bỏ trùng (PID,ZID)
            $unique = [];
            $dedup = [];
            foreach ($pzBatch as $row) {
                $key = $row['PID'] . '-' . $row['ZID'];
                if (!isset($unique[$key])) {
                    $unique[$key] = true;
                    $dedup[] = $row;
                }
            }
            if (!empty($dedup)) {
                $this->db->table('person_zone')->insertBatch($dedup);
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
