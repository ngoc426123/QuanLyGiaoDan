<?php

namespace App\Controllers;

use CodeIgniter\Controller;

class DevReset extends Controller
{
    protected array $systemTables = ['migrations'];

    public function index()
    {
        // Allow only in development
        if (ENVIRONMENT !== 'development') {
            return $this->response->setStatusCode(403)->setBody('Forbidden');
        }

        $db = \Config\Database::connect();
        $tables = array_map('strtolower', $db->listTables());

        try { $db->disableForeignKeyChecks(); } catch (\Throwable $e) {}
        $forge = \Config\Database::forge();
        foreach ($tables as $table) {
            if (in_array($table, $this->systemTables, true)) {
                continue;
            }
            try {
                $forge->dropTable($table, true);
            } catch (\Throwable $e) {
                // ignore
            }
        }
        try { $db->enableForeignKeyChecks(); } catch (\Throwable $e) {}

        return redirect()->to(base_url('setup'));
    }
}
