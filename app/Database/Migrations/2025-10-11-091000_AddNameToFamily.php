<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * This migration is intentionally a no-op because its change
 * (adding `family.name`) has been merged into the initial schema
 * in 2025-10-11-085000_CreateInitialSchema.
 */
class AddNameToFamily extends Migration
{
    public function up()
    {
        // No action needed. Column `family.name` is created by the initial migration.
    }

    public function down()
    {
        // No action. We don't remove the column to keep schema consistent.
    }
}
