<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use Config\Database;

class Overview extends BaseController
{
    public function index()
    {
        $db = Database::connect();
        // Basic aggregate metrics
        $totalPeople = (int) ($db->table('person')->selectCount('PID','c')->get()->getFirstRow()->c ?? 0);
    // Note: gender mapping changed: male = 0, female = 1
    $male = (int) ($db->table('person')->where('gender', 0)->selectCount('PID','c')->get()->getFirstRow()->c ?? 0);
    $female = (int) ($db->table('person')->where('gender', 1)->selectCount('PID','c')->get()->getFirstRow()->c ?? 0);
        $families = (int) ($db->table('family')->selectCount('FID','c')->get()->getFirstRow()->c ?? 0);
        $zones = (int) ($db->table('zone')->selectCount('ZID','c')->get()->getFirstRow()->c ?? 0);

        // Top zones by persons (via person_zone)
        $zoneStats = $db->table('zone z')
            ->select('z.name AS zone_name, COUNT(pz.PID) AS total')
            ->join('person_zone pz', 'pz.ZID = z.ZID', 'left')
            ->groupBy('z.ZID')
            ->orderBy('total', 'DESC')
            ->orderBy('z.ZID', 'ASC')
            ->limit(5)
            ->get()
            ->getResultArray();

        $zoneLabels = array_map(fn($r) => $r['zone_name'] ?: 'Không tên', $zoneStats);
        $zoneValues = array_map(fn($r) => (int) $r['total'], $zoneStats);

        // Top families by members (via person_family)
        $familyStats = $db->table('family f')
            ->select('f.name AS family_name, COUNT(pf.PID) AS members')
            ->join('person_family pf', 'pf.FID = f.FID', 'left')
            ->groupBy('f.FID')
            ->orderBy('members', 'DESC')
            ->orderBy('f.FID', 'ASC')
            ->limit(5)
            ->get()
            ->getResultArray();

        $data = [
            'page_title'   => 'Tổng quan',
            'activeTab'    => 'overview',
            // church info
            'church_name'  => church_name('Giáo xứ'),
            'church_addr'  => church_address(''),
            // metrics
            'total_people' => $totalPeople,
            'male'         => $male,
            'female'       => $female,
            'families'     => $families,
            'zones'        => $zones,
            // charts/list data
            'zone_labels'  => $zoneLabels,
            'zone_values'  => $zoneValues,
            'top_families' => $familyStats,
        ];
        return view('Overview', $data);
    }
}