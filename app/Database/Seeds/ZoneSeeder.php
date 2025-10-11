<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ZoneSeeder extends Seeder
{
    public function run()
    {
        $faker = \Faker\Factory::create('vi_VN');

        $pids = $this->db->table('person')->select('PID')->orderBy('PID', 'ASC')->get()->getResultArray();
        $pidList = array_map(fn($r) => $r['PID'], $pids);

        $count = rand(3, 4);
        $saints = ['Thánh Giuse', 'Thánh Phêrô', 'Thánh Gioan', 'Thánh Phaolô', 'Thánh Maria'];
        $batch = [];
        for ($i = 1; $i <= $count; $i++) {
            $lpId = !empty($pidList) && rand(0, 1) ? $faker->randomElement($pidList) : null;
            $batch[] = [
                'LPID' => $lpId,
                'name' => 'Khu ' . $i,
                'holy_name' => $faker->randomElement($saints),
                'note' => $faker->optional()->sentence(4),
                'CreatedAt' => date('Y-m-d H:i:s'),
                'UpdatedAt' => date('Y-m-d H:i:s'),
            ];
        }
        $this->db->table('zone')->insertBatch($batch);
    }
}
