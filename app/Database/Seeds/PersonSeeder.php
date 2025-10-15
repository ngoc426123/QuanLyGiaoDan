<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use Faker\Factory;

class PersonSeeder extends Seeder
{
    public function run()
    {
        $faker = \Faker\Factory::create('vi_VN');

        $holyNames = ['Giuse', 'Phêrô', 'Gioan', 'Maria', 'Têrêsa', 'Phanxicô', 'Phaolô'];
        $lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Võ'];

    $count = (int) getenv('SEED_PERSON_COUNT');
    if ($count <= 0) { $count = 50; }

    $batch = [];
    for ($i = 0; $i < $count; $i++) {
            $gender = $faker->randomElement([0, 1]);
            $first = $gender ? $faker->firstNameMale() : $faker->firstNameFemale();
            $last = $faker->randomElement($lastNames);

            $batch[] = [
                'holy_name' => $faker->randomElement($holyNames),
                'first_name' => $first,
                'last_name' => $last,
                'gender' => $gender,
                'date_of_birth' => $faker->date('Y-m-d', '-18 years'),
                'date_RT' => $faker->optional(0.3)->date('Y-m-d'),
                'date_RL' => $faker->optional(0.2)->date('Y-m-d'),
                'date_TS' => $faker->optional(0.2)->date('Y-m-d'),
                'date_HP' => $faker->optional(0.15)->date('Y-m-d'),
                'date_Dead' => null,
                'phone' => '09' . $faker->numberBetween(10000000, 99999999),
                'note' => $faker->optional()->sentence(6),
                'CreatedAt' => date('Y-m-d H:i:s'),
                'UpdatedAt' => date('Y-m-d H:i:s'),
            ];
        }

        $this->db->table('person')->insertBatch($batch);
    }
}
