<?php

namespace App\Models;

use CodeIgniter\Model;

class OptionsModel extends Model
{
    protected $table = 'options';
    protected $primaryKey = 'ID';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'key','value','note'
    ];

    protected $useTimestamps = false;
}
