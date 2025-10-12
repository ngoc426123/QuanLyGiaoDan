<?php

namespace App\Models;

use CodeIgniter\Model;

class ZoneModel extends Model
{
    protected $table = 'zone';
    protected $primaryKey = 'ZID';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'name','holy_name','note','CreatedAt','UpdatedAt'
    ];

    protected $useTimestamps = false;
}
