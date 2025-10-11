<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddNameToFamily extends Migration
{
    public function up()
    {
        // Thêm cột name VARCHAR(25) sau cột FID
        $fields = [
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 25,
                'null' => true,
                'after' => 'FID',
            ],
        ];
        $this->forge->addColumn('family', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('family', 'name');
    }
}
