<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Làm sạch dữ liệu để seed mẫu nhất quán
        $db = \Config\Database::connect();
        $db->disableForeignKeyChecks();
        foreach ([
            'person_family', 'person_zone', 'family_zone',
            'options', 'history',
            'zone', 'family', 'person',
        ] as $table) {
            // Dùng TRUNCATE nếu bảng tồn tại
            try {
                $db->table($table)->truncate();
            } catch (\Throwable $e) {
                // Bỏ qua nếu bảng chưa tồn tại
            }
        }
        $db->enableForeignKeyChecks();

        // Thứ tự: person -> family -> zone -> link tables
        $this->call(PersonSeeder::class);
        $this->call(FamilySeeder::class);
        $this->call(ZoneSeeder::class);
        $this->call(LinkSeeder::class);
    }
}
