<?php

namespace App\Models;

use CodeIgniter\Model;

class FamilyModel extends Model
{
    protected $table = 'family';
    protected $primaryKey = 'FID';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'address','note','CreatedAt','UpdatedAt'
    ];

    protected $useTimestamps = false;
}
