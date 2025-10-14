<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\OptionsModel;

class CustomMenu extends BaseController
{
    // keys that must not be editable via the UI
    protected array $excludedKeys = ['seed_persons', 'installed', 'installed_at'];

    public function index()
    {
        $model = new OptionsModel();

        $options = $model->orderBy('ID', 'ASC')->findAll();

        $data = [];
        $data['options'] = $options;
        
        $data['excludedKeys'] = $this->excludedKeys;
        $data['activeTab'] = 'custom-menu';

        return view('CustomMenu', $data);
    }

    public function save()
    {
        helper('form');
        if (! $this->request->is('post')) {
            return redirect()->to(site_url('custom-menu'));
        }

        $post = $this->request->getPost();
        $model = new OptionsModel();

        $values = $post['value'] ?? [];
        $notes = $post['note'] ?? [];

        // Update existing options
        foreach ($values as $id => $val) {
            $id = (int) $id;
            $row = $model->find($id);
            if (! $row) continue;

            // Protect excluded keys even if someone tampers with the form
            if (in_array($row['key'], $this->excludedKeys, true)) continue;

            $update = [];
            $update['value'] = is_scalar($val) ? $val : json_encode($val, JSON_UNESCAPED_UNICODE);
            if (isset($notes[$id])) {
                $update['note'] = $notes[$id];
            }
            $model->update($id, $update);
        }

        // Optionally handle adding a new option
        $newKey = trim($post['new_key'] ?? '');
        $newValue = $post['new_value'] ?? null;
        $newNote = $post['new_note'] ?? null;
        if ($newKey !== '') {
            // prevent creating excluded keys
            if (! in_array($newKey, $this->excludedKeys, true)) {
                // ensure key doesn't already exist
                $exists = $model->where('`key`', $newKey)->first();
                if (! $exists) {
                    $model->insert([
                        'key' => $newKey,
                        'value' => is_scalar($newValue) ? $newValue : json_encode($newValue, JSON_UNESCAPED_UNICODE),
                        'note' => $newNote,
                    ]);
                }
            }
        }

        

        return redirect()->to(site_url('custom-menu'))->with('success', 'Lưu tuỳ chỉnh thành công.');
    }
}
