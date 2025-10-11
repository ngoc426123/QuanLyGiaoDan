<?php

namespace App\Models;

use CodeIgniter\Model;

class PersonModel extends Model
{
    protected $table = 'person';
    protected $primaryKey = 'PID';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'holy_name','first_name','last_name','gender','date_of_birth','date_RT','date_RL','date_TS','date_HP','date_Dead','phone','note','CreatedAt','UpdatedAt'
    ];

    protected $useTimestamps = false; // dùng trường tùy chỉnh, không dùng created_at/updated_at mặc định
}
