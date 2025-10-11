<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class FamilySeeder extends Seeder
{
    public function run()
    {
        $faker = \Faker\Factory::create('vi_VN');
        $batch = [];
        for ($i = 1; $i <= 12; $i++) {
            $batch[] = [
                'address' => $faker->streetAddress() . ', ' . $faker->city(),
                'note' => 'Gia đình ' . $i,
                'CreatedAt' => date('Y-m-d H:i:s'),
                'UpdatedAt' => date('Y-m-d H:i:s'),
            ];
        }
        $this->db->table('family')->insertBatch($batch);
    }
}
