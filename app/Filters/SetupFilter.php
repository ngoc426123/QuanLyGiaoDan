<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

class SetupFilter implements FilterInterface
{
    protected array $expectedTables = [
        'person', 'family', 'zone',
        'person_family', 'person_zone', 'family_zone',
        'options', 'history',
    ];

    // System/auxiliary tables to ignore when checking extras
    protected array $systemTables = [
        'migrations', // CI4 migration history table
        // add 'ci_sessions' here if you enable DB sessions later
    ];

    public function before(RequestInterface $request, $arguments = null)
    {
        // Allow setup URIs to pass
        $path = strtolower(trim((string) $request->getUri()->getPath(), '/'));
        if ($path === 'setup' || str_starts_with($path, 'setup/')) {
            return; // continue
        }

        // For CLI or tests, skip
        if (is_cli()) {
            return;
        }

    $db = \Config\Database::connect();
    // Ensure migrations system is initialized so migrations table may exist
    try { \Config\Services::migrations(); } catch (\Throwable $e) {}
        $tables = array_map('strtolower', $db->listTables());

        // If already installed (options.installed = 1), do not enforce setup again
        if (in_array('options', $tables, true)) {
            try {
                $installed = $db->table('options')
                    ->select('value')
                    ->where('`key`', 'installed')
                    ->get()
                    ->getFirstRow();
                if ($installed && (string) $installed->value === '1') {
                    return; // skip any wiping or redirect once installed
                }
            } catch (\Throwable $e) {
                // ignore and continue normal checks
            }
        }

        // If no tables at all => go to setup (no need to drop)
        if (empty($tables)) {
            return redirect()->to(base_url('setup'));
        }

    $missing = array_diff($this->expectedTables, $tables);
    // Ignore known system tables when computing extras
    $known   = array_merge($this->expectedTables, $this->systemTables);
    $extras  = array_diff($tables, $known);

        // If missing any expected table OR there are unrelated tables => wipe and go to setup
        if (!empty($missing) || !empty($extras)) {
            $this->dropAllTables($db, $tables);
            return redirect()->to(base_url('setup'));
        }

        // All good -> continue
        return;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // no-op
    }

    protected function dropAllTables($db, array $tables): void
    {
        // Disable FK checks to drop in any order using framework API
        try { $db->disableForeignKeyChecks(); } catch (\Throwable $e) {}
        $forge = \Config\Database::forge();
        foreach ($tables as $table) {
            // Skip system tables if any slipped in
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
    }
}
