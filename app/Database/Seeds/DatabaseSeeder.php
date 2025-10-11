<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Làm sạch dữ liệu để seed mẫu nhất quán
        $db = \Config\Database::connect();
        $db->query('SET FOREIGN_KEY_CHECKS=0');
        foreach ([
            'person_family', 'person_zone', 'family_zone',
            'options', 'history',
            'zone', 'family', 'person',
        ] as $table) {
            // Dùng TRUNCATE nếu bảng tồn tại
            try {
                $db->query("TRUNCATE TABLE `{$table}`");
            } catch (\Throwable $e) {
                // Bỏ qua nếu bảng chưa tồn tại
            }
        }
        $db->query('SET FOREIGN_KEY_CHECKS=1');

        // Thứ tự: person -> family -> zone -> link tables
        $this->call(PersonSeeder::class);
        $this->call(FamilySeeder::class);
        $this->call(ZoneSeeder::class);
        $this->call(LinkSeeder::class);
    }
}
