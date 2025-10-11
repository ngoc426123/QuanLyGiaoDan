<?php

namespace App\Models;

use CodeIgniter\Model;

class PersonFamilyModel extends Model
{
    protected $table = 'person_family';
    protected $primaryKey = null; // PK kết hợp
    protected $useAutoIncrement = false;

    protected $allowedFields = [
        'PID','FID','relationship','note'
    ];

    protected $useTimestamps = false;
}
