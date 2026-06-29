/* ========================================
   オープニングアニメーション（クロスフェード）
   ・写真を順番にフェードで切り替え
   ・最後の写真は表示したまま、オーバーレイごとフェードアウト
   ・初回のみ表示（同じセッション中は再表示しない）
======================================== */
document.addEventListener('DOMContentLoaded', () => {


  const opening = document.getElementById('js-opening');
  if (!opening) return;

  // 【確認用】毎回流すため、初回判定を一時的に無効化中
  // ↓確認が終わったらこのブロックのコメントを外して「初回のみ」に戻す
  // if (sessionStorage.getItem('openingShown')) {
  //   opening.remove();
  //   return;
  // }
  // sessionStorage.setItem('openingShown', 'true');

  /* --- スライド画像を自動生成 ---
     img/photo/ の写真は 1.jpg, 2.jpg … と連番で統一しているので、
     枚数(PHOTO_COUNT)を変えるだけで読み込む写真を増減できる。 */
  const PHOTO_COUNT = 10;          // 表示する写真の枚数（連番の最大値）
  const PHOTO_DIR   = 'img/animation'; // 写真フォルダ
  const PHOTO_EXT   = 'jpg';       // 拡張子

  // ロゴより前に、写真スライドを順番に挿入する
  const logo = opening.querySelector('.opening__logo');
  for (let i = 1; i <= PHOTO_COUNT; i++) {
    const slide = document.createElement('div');
    slide.className = 'opening__slide';
    slide.style.backgroundImage = `url('${PHOTO_DIR}/${i}.${PHOTO_EXT}')`;
    opening.insertBefore(slide, logo);
  }

  const slides = opening.querySelectorAll('.opening__slide');
  if (slides.length === 0) {
      opening.remove();
    return;
  }

  const FIRST_DURATION = 600;  // 最初の写真の表示時間(ms) ※固定
  const LAST_DURATION  = 1800; // 最後の写真の表示時間(ms) ※固定
  const ACCEL          = 0.7;  // 切り替え間隔の加速率（1未満ほど速く加速）
  const MIN_DURATION   = 60;   // これ以上は速くしない下限(ms)
  let duration = FIRST_DURATION; // 写真ごとの表示時間（だんだん短くなる）
  let index = 0;
  let timer = null;

  // オーバーレイをフェードアウトして最後に削除する
  const finish = () => {
    if (timer) clearTimeout(timer);
    opening.classList.add('is-hidden');
    // 子スライドの transitionend がバブリングしてくるので、
    // オーバーレイ自身の opacity の完了だけを拾って削除する
    opening.addEventListener('transitionend', (e) => {
      if (e.target === opening && e.propertyName === 'opacity') {
        opening.remove();
      }
    });
  };

  // 次の写真へ進める。最後の写真に到達したら長めに見せてから終了
  // ※前の写真は消さず、新しい写真を上にフェードインさせる（下に不透明な写真が残るので青が透けない）
  const tick = () => {
    index++;
    slides[index].classList.add('is-active');

    if (index >= slides.length - 1) {
      // 最後の写真：LAST_DURATION 見せてからフェードアウト（固定）
      timer = setTimeout(finish, LAST_DURATION);
    } else {
      // 加速度的に間隔を詰める（下限 MIN_DURATION まで）
      duration = Math.max(duration * ACCEL, MIN_DURATION);
      timer = setTimeout(tick, duration);
    }
  };

  // 最初の1枚は、次フレームでクラスを付けてフェードインさせる
  // （読み込み直後に付けると遷移が効かず一瞬でパッと出てしまう）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slides[0].classList.add('is-active');
    });
  });

  // 1枚目は FIRST_DURATION（固定）見せてから、2枚目以降を加速させていく
  if (slides.length === 1) {
    timer = setTimeout(finish, LAST_DURATION);
  } else {
    timer = setTimeout(tick, FIRST_DURATION);
  }

  // クリックでスキップ
  opening.addEventListener('click', () => finish());
});
