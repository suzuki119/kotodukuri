/* ========================================
   ページ判定ヘルパー
   ・全ページで同じ main.js を読み込んでいるため、
     <main class="○○"> を見て対象ページでなければ何もしない
   ・「要素があるかどうか」ではなく「今どのページか」で発動を決める
======================================== */
const pageIs = (...names) => {
  const main = document.querySelector('main');
  return !!main && names.some((name) => main.classList.contains(name));
};


/* ========================================
   オープニングアニメーション（クロスフェード）
   ・写真を順番にフェードで切り替え
   ・最後の写真は表示したまま、オーバーレイごとフェードアウト
   ・初回のみ表示（同じセッション中は再表示しない）
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('top')) return;

  const opening = document.getElementById('js-opening');

  // 【確認用】毎回流すため、初回判定を一時的に無効化中
  // ↓確認が終わったらこのブロックのコメントを外して「初回のみ」に戻す
  if (sessionStorage.getItem('openingShown')) {
    opening.remove();
    return;
  }
  sessionStorage.setItem('openingShown', 'true');

  /* --- スライド画像を自動生成 ---
     img/photo/ の写真は 1.jpg, 2.jpg … と連番で統一しているので、
     枚数(PHOTO_COUNT)を変えるだけで読み込む写真を増減できる。 */
  const PHOTO_COUNT = 12;          // 表示する写真の枚数（連番の最大値）
  const PHOTO_DIR   = 'img/animation'; // 写真フォルダ
  const PHOTO_EXT   = 'webp';       // 拡張子

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
  const LAST_DURATION  = 900; // 最後の写真の表示時間(ms) ※固定
  const ACCEL          = 0.7;  // 切り替え間隔の加速率（1未満ほど速く加速）
  const MIN_DURATION   = 200;   // これ以上は速くしない下限(ms)
  let duration = FIRST_DURATION; // 写真ごとの表示時間（だんだん短くなる）
  let index = 0;
  let timer = null;

  // 写真ごとの拡大率：全体を通して段々大きくしていく（最後の写真が一番大きい）
  const MAX_SCALE = 1.2;  // 最後の写真まで到達する拡大率
  const POP_SCALE = 1.3; // 最後に一瞬だけ拡大する倍率
  const scaleFor = (i) => {
    if (slides.length <= 1) return 1;
    const ratio = i / (slides.length - 1); // 0(最初) → 1(最後)
    return 1 + (MAX_SCALE - 1) * ratio;    // 1 → MAX_SCALE へ連続的に増加
  };

  // 最後の写真の演出：大きいまま見せる → 一瞬さらに拡大 → 元の大きさへ戻してフェードアウト
  const LAST_HOLD   = 1000; // 最大まで拡大して見せる時間(ms) ※拡大の transition(1.2s)より長め
  const POP_TIME    = 200;  // 一瞬拡大にかける時間(ms)
  const RETURN_TIME = 200;  // 元の大きさへ戻す時間(ms)
  const finale = () => {
    const last = slides[slides.length - 1];

    // ① 最大まで拡大して少し見せる
    timer = setTimeout(() => {
      // ② 一瞬さらに拡大（キュッと速く）
timer = setTimeout(finish, RETURN_TIME + 300);
      timer = setTimeout(() => {
        // ③ 元の大きさへ戻す
        last.style.transition = `transform ${RETURN_TIME}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        last.style.transform  = 'scale(1)';
        // 戻り切ってからオーバーレイをフェードアウト

      }, POP_TIME);
    }, LAST_HOLD);
  };

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
      // 最後の写真：連続拡大 → 一瞬拡大 → 原寸に戻してフェードアウト
      finale();
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
      slides[0].style.transform = `scale(${scaleFor(0)})`;
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


/* ========================================
   スマホ：ハンバーガーメニューの開閉
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('js-nav-toggle');
  const header = document.querySelector('.header');
  if (!toggle || !header) return;

  // ボタンで開閉
  toggle.addEventListener('click', () => header.classList.toggle('is-open'));
  });


/* ========================================
   カードの開閉
   ・「閉じる」→ カードを左下へ格納し「開く」ボタンを表示
   ・「開く」→ カードを元に戻す
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('top')) return;

  document.querySelectorAll('.topContent__item').forEach((item) => {
    const closeBtn = item.querySelector('.card__close');
    const openBtn  = item.querySelector('.card__open');

    if (closeBtn) closeBtn.addEventListener('click', () => item.classList.add('is-closed'));
    if (openBtn)  openBtn.addEventListener('click',  () => item.classList.remove('is-closed'));
  });
});


/* ========================================
   クリックでコピー（メールアドレスなど）
   ・.js-copy を押すと data-copy の文字列をクリップボードへ
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('caution', 'contact', 'info', 'about', 'privacy', 'news')) return;

  document.querySelectorAll('.js-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || btn.textContent.trim();

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // 非対応ブラウザ／非セキュアコンテキスト用のフォールバック
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      // コピー完了を一時的に表示
      if (btn.classList.contains('is-copied')) return; // 連打対策
      const original = btn.textContent;
      btn.classList.add('is-copied');
      btn.textContent = 'コピーしました';
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('is-copied');
      }, 1500);
    });
  });
});


/* ========================================
   レンタル見取り図：該当の什器をハイライト
   ・見取り図は sticky で留まり、右のリストがスクロールしていく
   ・画面中央に来たリスト項目に合わせて、見取り図の什器が切り替わる
   ・ホバー／フォーカスがあればそちらを優先（自分で見たい所を選べる）
   ・data-area の値でレイヤー画像と結び付けている（counter / table / box / share）
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('about')) return;

  const map = document.querySelector('.js-floormap');
  const layers   = map.querySelectorAll('.floormap__layer');
  const items    = document.querySelectorAll('.rental__item');
  const triggers = document.querySelectorAll('.floormap__label, .rental__item');

  let scrollArea = null; // スクロールで選ばれている什器
  let hoverArea  = null; // ホバー／フォーカスで選ばれている什器（こちらが優先）

  // 今選ばれている什器だけを点灯させる。どちらも空なら全部消す
  const render = () => {
    const area = scrollArea;
    map.classList.toggle('is-active', Boolean(area));
    layers.forEach((layer) => layer.classList.toggle('is-on', layer.dataset.area === area));
    triggers.forEach((t) => t.classList.toggle('is-on', t.dataset.area === area));
  };

  triggers.forEach((trigger) => {
    const area = trigger.dataset.area;
    if (!area) return;

    const on  = () => { hoverArea = area; render(); };
    const off = () => { hoverArea = null; render(); };

    trigger.addEventListener('mouseenter', on);
    trigger.addEventListener('mouseleave', off);
    trigger.addEventListener('focusin',  on);   // キーボード操作でも光らせる
    trigger.addEventListener('focusout', off);
  });

  // スクロール連動：画面の中央あたりに入ったリスト項目を「今の什器」にする
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        scrollArea = entry.target.dataset.area;
        render();
      }
    });
  }, {
    // 上下を大きく削り、画面中央の細い帯に入ったものだけを拾う
    rootMargin: '-45% 0px -45% 0px',
  });

  items.forEach((item) => observer.observe(item));
});


/* ========================================
   レンタル見取り図（スマホ）：スクロールで図を全画面→右上へ縮小
   ・最初は図が画面を覆う大きさ、スクロールに連れてなめらかに縮む
   ・縮み切ると右上に小さく留まり、下のカードだけがスクロールしていく
   ・PC幅では何もしない（付けた transform を消す）
   ・画像自体は常に「大きい状態」の実寸で描画し、小さい状態はそれを縮小して作る
     （逆に小さく描いたものを拡大すると、ブラウザが低解像度のまま引き伸ばすため
     ぼやける。縮小方向なら実寸の解像度がそのまま活きるためシャープに保てる）
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('about')) return;

  const layout   = document.querySelector('.rental__layout');
  const visual   = document.querySelector('.rental__visual');
  const floormap = document.querySelector('.js-floormap');
  const scroller = document.body; // スクロール領域は body（html は overflow:hidden）
  const mq = window.matchMedia('(max-width: 768px)'); // SCSS の tablet ブレークポイントと揃える

  const STICKY_TOP = 70;  // 図が貼り付く位置（SCSS の .rental__visual の top と揃える）
  const RUNWAY     = 0.8; // 縮み切るまでのスクロール量（画面高比）。SCSS の margin-top: 80vh と揃える
  const LIFT       = 0.1; // 図を上へ持ち上げる割合（下の translateY と同じ値を使う）

  let endScale = 1; // 大きい実寸から、縮み切った状態まで縮める倍率（1以下）
  let ticking = false;

  // 縮み切った時の倍率を、SCSS が .rental__visual に確保させた高さから逆算する。
  // 図は translateY(-LIFT*100%) で持ち上げているので、確保した箱の上端より下に
  // はみ出す量は「実寸 × 倍率 × (1 - LIFT)」。これが確保した高さと一致する倍率なら、
  // sticky が解除される位置＝図の下端になり、図がセクションの外へはみ出さない。
  const measure = () => {
    if (!mq.matches) return; // PC幅では .rental__visual の高さは auto（＝図と同じ）なので計算しない
    const h = floormap.offsetHeight || 1; // offsetHeight は transform を無視した実寸（＝大きい状態の実寸）
    const restHeight = parseFloat(getComputedStyle(visual).height) || h;
    endScale = Math.min(1, restHeight / (h * (1 - LIFT)));
  };

  const update = () => {
    ticking = false;

    // PC幅では演出しない（付けた transform を戻す）
    if (!mq.matches) {
      floormap.style.transform = '';
      return;
    }

    // 図が上部(STICKY_TOP)に貼り付いた瞬間を 0、そこから RUNWAY 画面分で 1 になる進行度
    const top = layout.getBoundingClientRect().top;
    let p = (STICKY_TOP - top) / (window.innerHeight * RUNWAY);
    p = Math.min(Math.max(p, 0), 1);

    // p=0 で 1（実寸＝大）、p=1 で endScale（右上に収まる小ささ）へ、なめらかに補間
    const scale = 1 + (endScale - 1) * p;
    floormap.style.transform = `scale(${scale}) translateY(${-LIFT * 100}%)`; // 右上に寄せるために translateY で上へ移動
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update); // スクロールごとの再描画を1フレームに間引く
  };

  measure();
  update();

  // SVGはネットワーク経由で読み込まれるため、DOMContentLoaded時点ではまだ
  // 実寸が確定していないことがある（未読込のまま measure() すると startScale が
  // 狂い、初期表示のボケや読み込み後のガクつきの原因になる）→ 読み込み完了後に再計測
  const floormapImages = floormap.querySelectorAll('img');
  Promise.all(Array.from(floormapImages, (img) => (
    img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })
  ))).then(() => { measure(); update(); });

  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); });
  mq.addEventListener('change', () => { measure(); update(); });
});


/* ========================================
   トップの全画面セクションをループさせる
   ・最後の画面で下にスクロール → 最初へ
   ・最初の画面で上にスクロール → 最後へ
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('top')) return;

  const scroller = document.body; // body がスクロール領域（html は overflow:hidden）
  const sections = document.querySelectorAll('.topContent__item');
  if (sections.length <= 1) return; // 1画面しかなければループ不要

  let locked = false;   // ジャンプ直後の連続発火を防ぐ
  let accum = 0;        // 端でさらに回した量の合計
  let resetTimer = null;
  const THRESHOLD = 800; // この量を超えて余分に回したらループ（大きいほど飛びにくい）

  scroller.addEventListener('wheel', (e) => {
    if (locked) return;

    const atTop    = scroller.scrollTop <= 0;
    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;

    // 端で同方向に回しているときだけ量を貯める。手を止めたらリセット
    const pushingDown = e.deltaY > 0 && atBottom;
    const pushingUp   = e.deltaY < 0 && atTop;

    if (pushingDown || pushingUp) {
      accum += e.deltaY;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { accum = 0; }, 180); // スクロールを止めたらリセット
    } else {
      accum = 0; // 境界から離れた／逆方向に動いた → リセット
      return;
    }
  }, { passive: false });
});


/* ========================================
   動画ローディングアニメーション
   ・ヒーロー動画が再生できる状態になるまでスピナーを表示
   ・準備ができたらローダーをフェードアウトして動画を見せる
======================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!pageIs('about') && !pageIs('info') && !pageIs('renntaru')) return;

  document.querySelectorAll('.js-video-loader').forEach((loader) => {
    const video = loader.parentElement.querySelector('video');
    const hide = () => loader.classList.add('is-hidden');

    // キャッシュ済みなどで、すでに再生できる状態ならすぐ隠す
    if (video.readyState >= 3) {
      hide();
      return;
    }

    video.addEventListener('canplay', hide, { once: true });
    video.addEventListener('error', hide, { once: true });

    // 読み込みが極端に遅い・失敗したときに画面を塞ぎ続けないための保険
    setTimeout(hide, 10000);
  });
});


    document.addEventListener('DOMContentLoaded', () => {
        // 監視対象の要素を取得
        const target = document.querySelector('.message__text');

        if (!target) return;

        // Intersection Observer（要素が画面に入ったかを検知する機能）の設定
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 画面内に要素が入ってきたら
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-show'); // .is-show クラスを付与
                    observer.unobserve(entry.target); // 一度表示されたら監視を終了する（毎回動かしたい場合はこの行を削除）
                }
            });
        }, {
            rootMargin: '0px 0px -20% 0px' // 画面の下から20%の位置までスクロールされたら発火
        });

        // 監視を開始
        observer.observe(target);
    });

    /* ----------------------------------------
       レンタルスペースのタブ
       ・PC：5つを並べた普通のタブ
       ・スマホ：矢印とスワイプで送るカルーセルスライダー
         （中央に来たタブが選択され、下のパネルも切り替わる）
    ---------------------------------------- */
    document.addEventListener('DOMContentLoaded', () => {
        const carousel = document.querySelector('.tab-carousel');
        if (!carousel) return;

        const tabList = carousel.querySelector('.tab-list');
        const tabItems = Array.from(carousel.querySelectorAll('.tab-item'));
        const contentPanels = Array.from(document.querySelectorAll('.content-panel'));
        const prevBtn = carousel.querySelector('.tab-carousel__arrow--prev');
        const nextBtn = carousel.querySelector('.tab-carousel__arrow--next');

        if (!tabList || tabItems.length === 0) return;

        const activeIndex = tabItems.findIndex(item => item.classList.contains('active'));
        let current = activeIndex === -1 ? 0 : activeIndex;

        // 選んだタブをスライダーの中央へ送る。
        // offsetLeft は offsetParent 次第でずれるので、実際の座標差から求める。
        // PC幅はスクロールの余地が無いため scrollTo は何も起こさない。
        const centerTab = (item, behavior) => {
            const offset = item.getBoundingClientRect().left - tabList.getBoundingClientRect().left;
            const left = tabList.scrollLeft + offset - (tabList.clientWidth - item.offsetWidth) / 2;
            tabList.scrollTo({ left, behavior });
        };

        const select = (index, behavior) => {
            current = index;

            tabItems.forEach((tab, i) => tab.classList.toggle('active', i === index));

            const targetTabId = `tab-${tabItems[index].dataset.tab}`;
            contentPanels.forEach(panel => panel.classList.toggle('active', panel.id === targetTabId));

            // 端では矢印を消す（押しても動かないボタンを残さない）
            if (prevBtn) prevBtn.disabled = index === 0;
            if (nextBtn) nextBtn.disabled = index === tabItems.length - 1;

            centerTab(tabItems[index], behavior);
        };

        tabItems.forEach((item, i) => {
            item.addEventListener('click', () => select(i, 'smooth'));
        });

        if (prevBtn) prevBtn.addEventListener('click', () => select(Math.max(current - 1, 0), 'smooth'));
        if (nextBtn) nextBtn.addEventListener('click', () => select(Math.min(current + 1, tabItems.length - 1), 'smooth'));

        // スワイプで止まった位置に一番近いタブを選択する（スライダーとしての操作）。
        // select() 自身も scrollTo で動かすが、その時は nearest === current になり何も起きない。
        const syncToNearest = () => {
            const center = tabList.getBoundingClientRect().left + tabList.clientWidth / 2;

            let nearest = current;
            let shortest = Infinity;

            tabItems.forEach((item, i) => {
                const rect = item.getBoundingClientRect();
                const distance = Math.abs(rect.left + rect.width / 2 - center);
                if (distance < shortest) {
                    shortest = distance;
                    nearest = i;
                }
            });

            if (nearest !== current) select(nearest, 'smooth');
        };

        // scrollend は Safari が未対応なので、スクロールが途切れたのをタイマーで拾う
        let scrollEndTimer;
        tabList.addEventListener('scroll', () => {
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(syncToNearest, 140);
        }, { passive: true });

        // 初期表示：選択中のタブを中央に置いた状態から始める
        select(current, 'auto');
    });