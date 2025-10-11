<?php
use CodeIgniter\Pager\PagerRenderer;
/** @var PagerRenderer $pager */
$pager->setSurroundCount(2);

// Helper to add classes conditionally
$li = function (bool $disabled = false, bool $active = false, string $extra = ''): string {
    $classes = ['page-item'];
    if ($disabled) $classes[] = 'disabled';
    if ($active) $classes[] = 'active';
    if ($extra) $classes[] = $extra;
    return 'class="' . implode(' ', $classes) . '"';
};
?>
<nav aria-label="<?= lang('Pager.pageNavigation') ?>">
  <ul class="pagination mb-0">
    <?php if ($pager->hasPrevious()) : ?>
      <li <?= $li(false, false) ?>>
        <a class="page-link" href="<?= $pager->getFirst() ?>" aria-label="<?= lang('Pager.first') ?>">
          <i class="fas fa-angles-left"></i>
        </a>
      </li>
      <li <?= $li(false, false) ?>>
        <a class="page-link" href="<?= $pager->getPrevious() ?>" aria-label="<?= lang('Pager.previous') ?>">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    <?php else: ?>
      <li <?= $li(true, false) ?>>
        <span class="page-link" aria-hidden="true"><i class="fas fa-angles-left"></i></span>
      </li>
      <li <?= $li(true, false) ?>>
        <span class="page-link" aria-hidden="true"><i class="fas fa-chevron-left"></i></span>
      </li>
    <?php endif ?>

    <?php foreach ($pager->links() as $link) : ?>
      <li <?= $li(false, $link['active']) ?>>
        <a class="page-link<?= $link['active'] ? ' text-white' : '' ?>" href="<?= $link['uri'] ?>"><?= esc($link['title']) ?></a>
      </li>
    <?php endforeach ?>

    <?php if ($pager->hasNext()) : ?>
      <li <?= $li(false, false) ?>>
        <a class="page-link" href="<?= $pager->getNext() ?>" aria-label="<?= lang('Pager.next') ?>">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
      <li <?= $li(false, false) ?>>
        <a class="page-link" href="<?= $pager->getLast() ?>" aria-label="<?= lang('Pager.last') ?>">
          <i class="fas fa-angles-right"></i>
        </a>
      </li>
    <?php else: ?>
      <li <?= $li(true, false) ?>>
        <span class="page-link" aria-hidden="true"><i class="fas fa-chevron-right"></i></span>
      </li>
      <li <?= $li(true, false) ?>>
        <span class="page-link" aria-hidden="true"><i class="fas fa-angles-right"></i></span>
      </li>
    <?php endif ?>
  </ul>
</nav>
