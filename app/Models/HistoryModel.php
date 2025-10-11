<?php

namespace App\Models;

use CodeIgniter\Model;

class HistoryModel extends Model
{
    protected $table = 'history';
    protected $primaryKey = 'ID';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'type','name','content','time'
    ];

    protected $useTimestamps = false;
}
