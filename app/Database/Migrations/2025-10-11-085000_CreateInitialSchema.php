<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateInitialSchema extends Migration
{
    protected array $tableAttributes = [
        'ENGINE' => 'InnoDB',
        'DEFAULT CHARSET' => 'utf8mb4',
        'COLLATE' => 'utf8mb4_general_ci',
    ];

    public function up()
    {
        // person
        $this->forge->addField([
            'PID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'holy_name' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'first_name' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'last_name' => [
                'type' => 'VARCHAR',
                'constraint' => 75,
                'null' => true,
            ],
            'gender' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'null' => true,
            ],
            'date_of_birth' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'date_RT' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'date_RL' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'date_TS' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'date_HP' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'date_Dead' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'phone' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'null' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'CreatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'UpdatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('PID', true);
        $this->forge->createTable('person', true, $this->tableAttributes);

        // family
        $this->forge->addField([
            'FID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'address' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'CreatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'UpdatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('FID', true);
        $this->forge->createTable('family', true, $this->tableAttributes);

        // zone
        $this->forge->addField([
            'ZID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'LPID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'null' => true, // có thể để trống nếu chưa có người quản lý
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 25,
                'null' => true,
            ],
            'holy_name' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'CreatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'UpdatedAt' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('ZID', true);
        $this->forge->addForeignKey('LPID', 'person', 'PID', 'SET NULL', 'CASCADE');
        $this->forge->createTable('zone', true, $this->tableAttributes);

        // person_family (bảng liên kết person - family)
        $this->forge->addField([
            'PID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'FID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'relationship' => [
                'type' => 'VARCHAR',
                'constraint' => 25,
                'null' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey(['PID', 'FID'], true); // khóa chính kết hợp
        $this->forge->addForeignKey('PID', 'person', 'PID', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('FID', 'family', 'FID', 'CASCADE', 'CASCADE');
        $this->forge->createTable('person_family', true, $this->tableAttributes);

        // person_zone (bảng liên kết person - zone)
        $this->forge->addField([
            'PID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'ZID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey(['PID', 'ZID'], true); // khóa chính kết hợp
        $this->forge->addForeignKey('PID', 'person', 'PID', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('ZID', 'zone', 'ZID', 'CASCADE', 'CASCADE');
        $this->forge->createTable('person_zone', true, $this->tableAttributes);

        // family_zone (bảng liên kết family - zone)
        $this->forge->addField([
            'FID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'ZID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey(['FID', 'ZID'], true); // khóa chính kết hợp
        $this->forge->addForeignKey('FID', 'family', 'FID', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('ZID', 'zone', 'ZID', 'CASCADE', 'CASCADE');
        $this->forge->createTable('family_zone', true, $this->tableAttributes);

        // options (giữ nguyên như mô hình)
        $this->forge->addField([
            'ID' => [
                'type' => 'INT',
                'constraint' => 3,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'key' => [
                'type' => 'VARCHAR',
                'constraint' => 10,
                'null' => true,
            ],
            'value' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
                'null' => true,
            ],
            'note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('ID', true);
        $this->forge->createTable('options', true, $this->tableAttributes);

        // history (giữ nguyên như mô hình)
        $this->forge->addField([
            'ID' => [
                'type' => 'INT',
                'constraint' => 10,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'type' => [
                'type' => 'VARCHAR',
                'constraint' => 10,
                'null' => true,
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 25,
                'null' => true,
            ],
            'content' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'time' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('ID', true);
        $this->forge->createTable('history', true, $this->tableAttributes);
    }

    public function down()
    {
        // Drop các bảng con trước để tránh lỗi ràng buộc
        $this->forge->dropTable('family_zone', true);
        $this->forge->dropTable('person_zone', true);
        $this->forge->dropTable('person_family', true);

        // Bảng có khóa ngoại
        $this->forge->dropTable('zone', true);
        $this->forge->dropTable('family', true);
        $this->forge->dropTable('person', true);

        // Bảng độc lập
        $this->forge->dropTable('options', true);
        $this->forge->dropTable('history', true);
    }
}
