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
        $tables = array_map('strtolower', $db->listTables());

        // If no tables at all => go to setup (no need to drop)
        if (empty($tables)) {
            return redirect()->to(base_url('setup'));
        }

        $missing = array_diff($this->expectedTables, $tables);
        $extras  = array_diff($tables, $this->expectedTables);

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
        // Disable FK checks to drop in any order
        try { $db->query('SET FOREIGN_KEY_CHECKS=0'); } catch (\Throwable $e) {}
        foreach ($tables as $table) {
            try {
                $db->query("DROP TABLE IF EXISTS `{$table}`");
            } catch (\Throwable $e) {
                // ignore
            }
        }
        try { $db->query('SET FOREIGN_KEY_CHECKS=1'); } catch (\Throwable $e) {}
    }
}
