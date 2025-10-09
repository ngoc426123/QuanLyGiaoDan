<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index(): string
    {
        // Sử dụng layout làm bố cục chính
        return view('layout');
    }
}
