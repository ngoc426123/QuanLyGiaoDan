<?php

namespace App\Models;

use CodeIgniter\Model;

class FamilyZoneModel extends Model
{
    protected $table = 'family_zone';
    protected $primaryKey = null; // PK kết hợp
    protected $useAutoIncrement = false;

    protected $allowedFields = [
        'FID','ZID','note'
    ];

    protected $useTimestamps = false;
}
