<?php

namespace App\Models;

use CodeIgniter\Model;

class PersonZoneModel extends Model
{
    protected $table = 'person_zone';
    protected $primaryKey = null; // PK kết hợp
    protected $useAutoIncrement = false;

    protected $allowedFields = [
        'PID','ZID','note'
    ];

    protected $useTimestamps = false;
}
