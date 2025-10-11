<?php

namespace App\Controllers;

use App\Models\OptionsModel;
use CodeIgniter\Controller;

class Setup extends Controller
{
    protected array $expectedTables = [
        'person', 'family', 'zone',
        'person_family', 'person_zone', 'family_zone',
        'options', 'history',
    ];

    public function index()
    {
        helper(['form', 'url']);

        // If already installed (all expected tables exist), redirect to home
        $db = \Config\Database::connect();
        $existing = array_map('strtolower', $db->listTables());
        $installed = !array_diff($this->expectedTables, $existing);
        if ($installed) {
            return redirect()->to(base_url('/'));
        }

        return view('setup/index');
    }

    public function install()
    {
        helper(['form', 'url']);

        $validation = service('validation');
        $validation->setRules([
            'church_name'    => 'required|min_length[2]|max_length[100]',
            'church_address' => 'permit_empty|max_length[200]',
            'date_format'    => 'required|in_list[dd/mm/yyyy,mm/dd/yyyy]',
            'sample_data'    => 'permit_empty|in_list[0,1]'
        ]);

        if (!$validation->withRequest($this->request)->run()) {
            return redirect()->back()->withInput()->with('errors', $validation->getErrors());
        }

    $churchName = trim((string) $this->request->getPost('church_name'));
    $churchAddress = trim((string) $this->request->getPost('church_address'));
        $dateFormat = (string) $this->request->getPost('date_format');
        $sampleData = (string) $this->request->getPost('sample_data') === '1';

        $db = \Config\Database::connect();

        // 1) Run all migrations (create tables)
        $migrate = \Config\Services::migrations();
        try {
            $migrate->latest();
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('errors', ['migrate' => $e->getMessage()]);
        }

        // 2) Optionally insert sample data
        if ($sampleData) {
            try {
                $seeder = \Config\Database::seeder();
                $seeder->call('DatabaseSeeder');
            } catch (\Throwable $e) {
                // Proceed but show warning message
                session()->setFlashdata('setup_warning', 'Sample data seeding failed: ' . $e->getMessage());
            }
        }

        // 3) Save settings into options table
        try {
            $options = new OptionsModel();
            $this->saveOption($options, 'church_name', $churchName);
            $this->saveOption($options, 'date_format', $dateFormat);
            if ($churchAddress !== '') {
                $this->saveOption($options, 'church_address', $churchAddress);
            }
            $this->saveOption($options, 'installed', '1');
            $this->saveOption($options, 'installed_at', date('Y-m-d H:i:s'));
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('errors', ['options' => $e->getMessage()]);
        }

        // Done -> redirect to homepage
        session()->setFlashdata('setup_success', 'Installation completed.');
        return redirect()->to(base_url('/'));
    }

    private function saveOption(OptionsModel $model, string $key, ?string $value, ?string $note = null): void
    {
        // Upsert-like: if exists, update; else insert
        $row = $model->where('key', $key)->first();
        if ($row) {
            $model->update($row['ID'], [
                'value' => $value,
                'note'  => $note,
            ]);
        } else {
            $model->insert([
                'key'   => $key,
                'value' => $value,
                'note'  => $note,
            ]);
        }
    }
}
