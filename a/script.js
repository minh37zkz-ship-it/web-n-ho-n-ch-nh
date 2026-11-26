/* ==========================================================
   MiuCos - script.js
   Đặt cùng thư mục với index.html. Gồm 6 hiệu ứng:
   1. Header thu nhỏ khi cuộn + nút "Lên đầu trang"
   2. Chữ banner chuyển động khi đổi slide
   3. Khối nội dung hiện dần khi cuộn tới
   4. Mũi tên trái/phải cho danh sách ngang
   5. Nút Thích (bài viết, bình luận, bản tin)
   6. Thông báo nhỏ khi bấm "Thêm Vào Giỏ Hàng"
   7. Gợi ý sản phẩm khi gõ vào ô tìm kiếm
   8. Liên kết menu với hạng mục: đánh dấu mục đang xem, nháy ô được mở
   Muốn tắt hiệu ứng nào: đặt dấu // trước dòng gọi hàm tương ứng ở cuối tệp.
   ========================================================== */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Hàm dùng chung ---------- */
    const readNum = (el) => parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;

    const bump = (el, delta) => {
        if (el) el.textContent = Math.max(0, readNum(el) + delta).toLocaleString('vi-VN');
    };

    const pop = (el) => {
        if (!el) return;
        el.classList.remove('pop');
        void el.offsetWidth; // buộc trình duyệt chạy lại hiệu ứng
        el.classList.add('pop');
    };

    function showToast(message) {
        let wrap = document.querySelector('.mc-toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'mc-toast-wrap';
            wrap.setAttribute('role', 'status');
            wrap.setAttribute('aria-live', 'polite');
            document.body.appendChild(wrap);
        }
        const toast = document.createElement('div');
        toast.className = 'mc-toast';
        toast.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span></span>';
        toast.lastChild.textContent = message;
        wrap.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 2400);
    }

    /* ---------- 1. HEADER THU NHỎ + NÚT LÊN ĐẦU TRANG ---------- */
    function setupScrollUI() {
        const header = document.querySelector('.site-header');

        const topBtn = document.createElement('button');
        topBtn.type = 'button';
        topBtn.className = 'back-to-top';
        topBtn.setAttribute('aria-label', 'Lên đầu trang');
        topBtn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
        document.body.appendChild(topBtn);
        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });

        // Hai ngưỡng khác nhau (80 và 10) để header không bị nhấp nháy khi co/giãn
        let shrunk = false;
        let ticking = false;
        const update = () => {
            const y = window.scrollY;
            if (header) {
                if (!shrunk && y > 80) {
                    shrunk = true;
                    header.classList.add('is-scrolled');
                } else if (shrunk && y < 10) {
                    shrunk = false;
                    header.classList.remove('is-scrolled');
                }
            }
            topBtn.classList.toggle('show', y > 500);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
        update();
    }

    /* ---------- 2. CHỮ BANNER CHUYỂN ĐỘNG KHI ĐỔI SLIDE ---------- */
    function setupHero() {
        const hero = document.getElementById('heroCarousel');
        if (!hero || reduceMotion) return;
        const play = (slide) => {
            if (!slide) return;
            slide.classList.remove('hero-anim');
            void slide.offsetWidth;
            slide.classList.add('hero-anim');
        };
        play(hero.querySelector('.carousel-item.active'));
        hero.addEventListener('slide.bs.carousel', (e) => play(e.relatedTarget));
    }

    /* ---------- 3. HIỆN DẦN KHI CUỘN TỚI ---------- */
    function setupReveal() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        const groups = new Map(); // phần tử kích hoạt -> danh sách phần tử cần hiện
        const add = (trigger, items) => {
            if (!trigger || !items.length) return;
            // Phần đã nằm trong màn hình lúc mở trang thì giữ nguyên, không làm ẩn
            if (trigger.getBoundingClientRect().top < window.innerHeight * 0.9) return;
            items.forEach((el) => el.classList.add('reveal'));
            groups.set(trigger, items);
        };

        const productGrid = document.querySelector('#productSection .col-lg-8 .row');
        if (productGrid) add(productGrid, Array.from(productGrid.children));

        document.querySelectorAll('.cat-scroller').forEach((s) => add(s, Array.from(s.children)));
        document.querySelectorAll('.category-grid').forEach((g) => add(g, Array.from(g.children)));
        document.querySelectorAll('.prod-list').forEach((l) => add(l, Array.from(l.children)));
        document.querySelectorAll('.post-card').forEach((p) => add(p, [p]));

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                groups.get(entry.target).forEach((el, i) => {
                    const delay = Math.min(i, 5) * 90;
                    el.style.setProperty('--reveal-delay', delay + 'ms');
                    el.classList.add('in-view');
                    // Gỡ lớp hiệu ứng sau khi chạy xong để không ảnh hưởng hiệu ứng rê chuột
                    setTimeout(() => {
                        el.classList.remove('reveal', 'in-view');
                        el.style.removeProperty('--reveal-delay');
                    }, delay + 800);
                });
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        groups.forEach((_, trigger) => io.observe(trigger));
    }

    /* ---------- 4. MŨI TÊN CHO DANH SÁCH NGANG ---------- */
    function setupScrollers() {
        document.querySelectorAll('.cat-scroller').forEach((scroller) => {
            const wrap = document.createElement('div');
            wrap.className = 'cat-scroller-wrap';
            scroller.parentNode.insertBefore(wrap, scroller);
            wrap.appendChild(scroller);

            const makeBtn = (dir) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'scroll-btn scroll-btn-' + (dir < 0 ? 'prev' : 'next');
                btn.setAttribute('aria-label', dir < 0 ? 'Cuộn sang trái' : 'Cuộn sang phải');
                btn.innerHTML = '<i class="fa-solid fa-chevron-' + (dir < 0 ? 'left' : 'right') + '" aria-hidden="true"></i>';
                btn.addEventListener('click', () => {
                    scroller.scrollBy({ left: dir * Math.max(scroller.clientWidth * 0.8, 200), behavior: 'smooth' });
                });
                wrap.appendChild(btn);
                return btn;
            };
            const prev = makeBtn(-1);
            const next = makeBtn(1);

            const update = () => {
                const max = scroller.scrollWidth - scroller.clientWidth - 2;
                prev.classList.toggle('is-hidden', scroller.scrollLeft <= 2);
                next.classList.toggle('is-hidden', scroller.scrollLeft >= max);
            };
            scroller.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            update();
        });
    }

    /* ---------- 5 + 6. NÚT THÍCH & THÊM GIỎ HÀNG (bắt sự kiện chung) ---------- */
    function setupActions() {
        document.addEventListener('click', (e) => {
            // Thích bài viết
            const postBtn = e.target.closest('.post-action');
            if (postBtn && !postBtn.classList.contains('react-btn') && postBtn.querySelector('.fa-thumbs-up')) {
                const liked = postBtn.classList.toggle('liked');
                const icon = postBtn.querySelector('i');
                icon.classList.toggle('fa-solid', liked);
                icon.classList.toggle('fa-regular', !liked);
                bump(postBtn.closest('.post-card').querySelector('.post-stats .like-count'), liked ? 1 : -1);
                pop(icon);
                return;
            }

            // Thích bình luận
            const cmtBtn = e.target.closest('.comment-meta button');
            if (cmtBtn && cmtBtn.textContent.trim() === 'Thích') {
                const liked = cmtBtn.classList.toggle('liked');
                const likes = cmtBtn.closest('.flex-grow-1').querySelector('.comment-likes');
                bump(likes.querySelector('.like-count'), liked ? 1 : -1);
                pop(likes);
                return;
            }

            // Thả tim ở bản tin
            const newsBtn = e.target.closest('.news-like');
            if (newsBtn) {
                const liked = newsBtn.classList.toggle('liked');
                const icon = newsBtn.querySelector('i');
                icon.classList.toggle('fa-solid', liked);
                icon.classList.toggle('fa-regular', !liked);
                bump(newsBtn.querySelector('.like-count'), liked ? 1 : -1);
                pop(icon);
                return;
            }

            // Thêm vào giỏ hàng
            const cartBtn = e.target.closest('.btn-mint');
            if (cartBtn && cartBtn.querySelector('.fa-cart-shopping')) {
                if (cartBtn.dataset.busy) return;
                cartBtn.dataset.busy = '1';
                const original = cartBtn.innerHTML;
                const titleEl = cartBtn.closest('.card') && cartBtn.closest('.card').querySelector('.card-title');
                const title = titleEl ? titleEl.textContent.trim() : '';
                cartBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thêm vào giỏ';
                showToast(title ? 'Đã thêm “' + title + '” vào giỏ hàng' : 'Đã thêm vào giỏ hàng');
                setTimeout(() => {
                    cartBtn.innerHTML = original;
                    delete cartBtn.dataset.busy;
                }, 1600);
            }
        });
    }

    /* ---------- 7. GỢI Ý Ô TÌM KIẾM ---------- */
    function setupSearchSuggest() {
        const input = document.querySelector('.search-input-inner');
        if (!input) return;
        const box = input.closest('.header-search-container');
        if (!box) return;

        // Bỏ dấu tiếng Việt và chữ thường để "ao dai" vẫn khớp với "Áo Dài"
        const norm = (s) => s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        // Lấy dữ liệu trực tiếp từ các thẻ trên trang, nên khi thêm sản phẩm thì gợi ý tự cập nhật
        const sectionLabels = {
            productSection: 'Mới cập nhật',
            'thue-trang-phuc': 'Thuê trang phục',
            'mua-trang-phuc': 'Mua trang phục',
            'phu-kien-hoa-trang': 'Phụ kiện hóa trang'
        };
        const items = [];
        const seen = new Set();
        const add = (name, cat) => {
            const key = norm(name);
            if (!name || seen.has(key)) return;
            seen.add(key);
            items.push({ name: name, cat: cat, key: key });
        };
        document.querySelectorAll('.cat-item').forEach((a) => {
            const section = a.closest('section');
            add(a.querySelector('h6').textContent.trim(), sectionLabels[section && section.id] || '');
        });
        document.querySelectorAll('#productSection .card-title').forEach((t) => {
            add(t.textContent.trim(), sectionLabels.productSection);
        });

        const trending = ['Genshin Impact', 'Concert', 'Áo dài', 'Wig', 'Hán phục'];

        // Tạo hộp gợi ý
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-controls', 'searchSuggest');
        input.setAttribute('autocomplete', 'off');

        const list = document.createElement('ul');
        list.className = 'search-suggest';
        list.id = 'searchSuggest';
        list.setAttribute('role', 'listbox');
        list.hidden = true;
        box.appendChild(list);

        let active = -1;

        const isOpen = () => !list.hidden;
        const close = () => {
            list.hidden = true;
            input.setAttribute('aria-expanded', 'false');
            active = -1;
        };
        const open = () => {
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
        };

        const setActive = (index) => {
            const opts = list.querySelectorAll('[role="option"]');
            if (!opts.length) return;
            active = (index + opts.length) % opts.length;
            opts.forEach((o, i) => {
                const on = i === active;
                o.classList.toggle('is-active', on);
                o.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            input.setAttribute('aria-activedescendant', opts[active].id);
        };

        const choose = (text) => {
            input.value = text;
            close();
            showToast('Đã chọn “' + text + '”');
        };

        const makeOption = (label, cat, icon, index) => {
            const li = document.createElement('li');
            li.id = 'sg-opt-' + index;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');

            const i = document.createElement('i');
            i.className = 'fa-solid ' + icon + ' sg-icon';
            i.setAttribute('aria-hidden', 'true');

            const text = document.createElement('span');
            text.textContent = label;

            li.append(i, text);
            if (cat) {
                const c = document.createElement('span');
                c.className = 'sg-cat';
                c.textContent = cat;
                li.appendChild(c);
            }

            // mousedown thay vì click để ô nhập không mất tiêu điểm trước khi chọn
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                choose(label);
            });
            li.addEventListener('mouseenter', () => setActive(index));
            return li;
        };

        const render = (q) => {
            const nq = norm(q);
            list.textContent = '';
            let index = 0;

            if (!nq) {
                const head = document.createElement('li');
                head.className = 'sg-head';
                head.textContent = 'Tìm nhiều nhất';
                head.setAttribute('role', 'presentation');
                list.appendChild(head);
                trending.forEach((t) => list.appendChild(makeOption(t, '', 'fa-fire', index++)));
            } else {
                const matches = items
                    .filter((it) => it.key.indexOf(nq) !== -1)
                    .sort((a, b) => (a.key.indexOf(nq) === 0 ? 0 : 1) - (b.key.indexOf(nq) === 0 ? 0 : 1))
                    .slice(0, 6);

                if (!matches.length) {
                    const empty = document.createElement('li');
                    empty.className = 'sg-empty';
                    empty.setAttribute('role', 'presentation');
                    empty.textContent = 'Chưa có gợi ý cho “' + q.trim() + '”';
                    list.appendChild(empty);
                } else {
                    const head = document.createElement('li');
                    head.className = 'sg-head';
                    head.textContent = 'Gợi ý sản phẩm';
                    head.setAttribute('role', 'presentation');
                    list.appendChild(head);
                    matches.forEach((it) => list.appendChild(makeOption(it.name, it.cat, 'fa-shirt', index++)));
                }
            }
            open();
            active = -1;
        };

        input.addEventListener('focus', () => render(input.value));
        input.addEventListener('input', () => render(input.value));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!isOpen()) render(input.value);
                setActive(active + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (isOpen()) setActive(active - 1);
            } else if (e.key === 'Enter' && isOpen() && active >= 0) {
                e.preventDefault();
                choose(list.querySelectorAll('[role="option"]')[active].querySelector('span').textContent);
            } else if (e.key === 'Escape' && isOpen()) {
                e.preventDefault();
                close();
            }
        });

        // Bấm ra ngoài thì đóng gợi ý
        document.addEventListener('click', (e) => {
            if (!box.contains(e.target)) close();
        });
    }

    /* ---------- 8. LIÊN KẾT MENU ↔ HẠNG MỤC ---------- */
    function setupMenuLinks() {
        // Đánh dấu mục menu đang trỏ tới đúng hạng mục đang xem
        const markCurrent = () => {
            document.querySelectorAll('.dropdown-item.is-current').forEach((x) => x.classList.remove('is-current'));
            const hash = window.location.hash;
            document.querySelectorAll('.dropdown-item').forEach((x) => {
                const u = new URL(x.href, window.location.href);
                if (u.pathname === window.location.pathname && u.hash === hash) {
                    x.classList.add('is-current');
                }
            });
        };

        // Nháy viền ô hạng mục một lần để người dùng thấy đã tới đúng chỗ
        const flash = (id) => {
            const el = id && document.getElementById(id);
            if (!el) return;
            el.classList.remove('anchor-flash');
            void el.offsetWidth; // buộc trình duyệt chạy lại hiệu ứng
            el.classList.add('anchor-flash');
            setTimeout(() => el.classList.remove('anchor-flash'), 2600);
        };

        const onHash = () => {
            markCurrent();
            if (!window.location.hash) return;
            const id = decodeURIComponent(window.location.hash.slice(1));
            // Đợi trang cuộn tới nơi rồi mới nháy
            setTimeout(() => flash(id), reduceMotion ? 0 : 450);
        };

        window.addEventListener('hashchange', onHash);
        onHash();
    }

    /* ---------- 9. MENU ĐIỆN THOẠI: CHẠM VÀO MỤC CÓ MŨI TÊN ĐỂ MỞ MENU CON ---------- */
    function setupNavTouch() {
        if (window.matchMedia('(hover: hover)').matches) return;
        const closeAll = () => document.querySelectorAll('.navbar-nav .dropdown-menu.show').forEach((m) => m.classList.remove('show'));
        document.querySelectorAll('.navbar-nav > .dropdown > .dropdown-toggle').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = link.parentElement.querySelector('.dropdown-menu');
                const open = !menu.classList.contains('show');
                closeAll();
                menu.classList.toggle('show', open);
            });
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar-nav')) closeAll();
        });
    }

    /* ---------- 11. CẢM XÚC BÀI VIẾT: RÊ CHUỘT (HOẶC NHẤN GIỮ) ĐỂ CHỌN ---------- */
    const REACTIONS = {
        like: { icon: 'fa-thumbs-up', text: 'Thích', color: '#1877f2' },
        love: { icon: 'fa-heart', text: 'Yêu thích', color: '#f33e58' },
        haha: { icon: 'fa-face-laugh-squint', text: 'Haha', color: '#f7b125' },
        wow: { icon: 'fa-face-surprise', text: 'Wow', color: '#f7b125' },
        sad: { icon: 'fa-face-sad-tear', text: 'Buồn', color: '#f7b125' }
    };

    function applyReaction(wrap, kind) {
        const btn = wrap.querySelector('.react-btn');
        const icon = btn.querySelector('i');
        const label = btn.querySelector('.react-label');
        const count = wrap.closest('.post-card').querySelector('.post-stats .like-count');
        const prev = wrap.dataset.kind || '';

        // Chọn lại cảm xúc đang chọn, hoặc bỏ chọn: trở về nút Thích thường
        if (!kind || kind === prev) {
            wrap.dataset.kind = '';
            icon.className = 'fa-regular fa-thumbs-up me-1';
            label.textContent = 'Thích';
            btn.classList.remove('liked');
            btn.style.color = '';
            if (prev) bump(count, -1);
            return;
        }

        const r = REACTIONS[kind];
        wrap.dataset.kind = kind;
        icon.className = 'fa-solid ' + r.icon + ' me-1';
        label.textContent = r.text;
        btn.classList.add('liked');
        btn.style.color = r.color;
        if (!prev) bump(count, 1);
    }

    function setupReactions() {
        let timer = null;
        let longPressed = false;

        // Trên điện thoại: nhấn giữ nút Thích để mở bảng cảm xúc
        document.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('.react-btn');
            if (!btn) return;
            longPressed = false;
            timer = setTimeout(() => {
                longPressed = true;
                btn.parentElement.classList.add('open');
            }, 450);
        });
        const cancel = () => clearTimeout(timer);
        document.addEventListener('pointerup', cancel);
        document.addEventListener('pointercancel', cancel);

        document.addEventListener('click', (e) => {
            const opt = e.target.closest('.react-opt');
            if (opt) {
                e.preventDefault();
                const wrap = opt.closest('.react-wrap');
                applyReaction(wrap, opt.dataset.kind);
                wrap.classList.remove('open');
                return;
            }
            const btn = e.target.closest('.react-btn');
            if (btn) {
                e.preventDefault();
                const wrap = btn.parentElement;
                if (longPressed) { longPressed = false; return; }
                applyReaction(wrap, wrap.dataset.kind ? null : 'like');
                return;
            }
            if (!e.target.closest('.react-wrap')) {
                document.querySelectorAll('.react-wrap.open').forEach((w) => w.classList.remove('open'));
            }
        });
    }

    /* ---------- 12. XEM ẢNH PHÓNG TO ---------- */
    function setupLightbox() {
        let overlay = null;
        let imgs = [];
        let idx = 0;

        const visibleImgs = () => Array.from(document.querySelectorAll('.post-img')).filter((i) => !i.closest('[hidden]'));

        const build = () => {
            overlay = document.createElement('div');
            overlay.className = 'mc-lightbox';
            overlay.hidden = true;
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'Xem ảnh');
            overlay.innerHTML =
                '<button type="button" class="lb-close" aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>' +
                '<button type="button" class="lb-nav lb-prev" aria-label="Ảnh trước"><i class="fa-solid fa-chevron-left"></i></button>' +
                '<img class="lb-img" alt="">' +
                '<button type="button" class="lb-nav lb-next" aria-label="Ảnh sau"><i class="fa-solid fa-chevron-right"></i></button>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.lb-close')) close();
                else if (e.target.closest('.lb-prev')) step(-1);
                else if (e.target.closest('.lb-next')) step(1);
            });
        };

        const show = () => {
            const src = imgs[idx];
            const img = overlay.querySelector('.lb-img');
            img.src = src.getAttribute('src');
            img.alt = src.alt;
        };

        const open = (i) => {
            if (!overlay) build();
            imgs = visibleImgs();
            idx = i;
            show();
            overlay.hidden = false;
            document.body.classList.add('lb-open');
            overlay.querySelector('.lb-close').focus();
        };

        const close = () => {
            overlay.hidden = true;
            document.body.classList.remove('lb-open');
        };

        const step = (d) => {
            idx = (idx + d + imgs.length) % imgs.length;
            show();
        };

        document.addEventListener('click', (e) => {
            const img = e.target.closest('.post-img');
            if (!img) return;
            const list = visibleImgs();
            open(list.indexOf(img));
        });

        document.addEventListener('keydown', (e) => {
            if (!overlay || overlay.hidden) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'ArrowRight') step(1);
        });
    }

    /* ---------- 10. CỘNG ĐỒNG FEED: SẮP XẾP, LỌC, XEM THÊM, THEO DÕI ---------- */
    function setupFeed() {
        const list = document.getElementById('feedList');
        if (!list) return;
        const posts = Array.from(list.querySelectorAll('.feed-post'));
        const more = document.getElementById('loadMore');
        const empty = document.getElementById('feedEmpty');
        const PAGE_SIZE = 6;
        let tab = 'new';
        let tag = 'all';
        let expanded = false;

        // Bài mới hiện ra thì hiện dần, giống hiệu ứng khi cuộn tới
        const revealPost = (el) => {
            if (reduceMotion) return;
            el.classList.add('reveal');
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in-view')));
            setTimeout(() => el.classList.remove('reveal', 'in-view'), 900);
        };

        const apply = () => {
            // Nổi bật: xếp theo lượt thích. Mới nhất: giữ thứ tự gốc.
            const ordered = tab === 'hot'
                ? posts.slice().sort((a, b) => Number(b.dataset.likes) - Number(a.dataset.likes))
                : posts.slice();
            ordered.forEach((p) => list.appendChild(p));

            const matched = posts.filter((p) => {
                if (tab === 'follow' && p.dataset.follow !== '1') return false;
                if (tag !== 'all' && p.dataset.tags.split(' ').indexOf(tag) === -1) return false;
                return true;
            });

            const limited = tag === 'all' && tab !== 'follow' && !expanded;
            const visible = limited ? matched.slice(0, PAGE_SIZE) : matched;

            posts.forEach((p) => {
                const show = visible.indexOf(p) !== -1;
                if (show && p.hidden) {
                    p.hidden = false;
                    revealPost(p);
                } else {
                    p.hidden = !show;
                }
            });

            empty.hidden = matched.length > 0;
            more.hidden = !(limited && matched.length > PAGE_SIZE);
        };

        const setTag = (t) => {
            tag = t;
            document.querySelectorAll('.feed-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.tag === t));
            apply();
        };

        document.querySelectorAll('.feed-tab').forEach((b) => {
            b.addEventListener('click', () => {
                tab = b.dataset.tab;
                document.querySelectorAll('.feed-tab').forEach((x) => {
                    const on = x === b;
                    x.classList.toggle('is-active', on);
                    x.setAttribute('aria-selected', on ? 'true' : 'false');
                });
                apply();
            });
        });

        document.querySelectorAll('.feed-chip').forEach((b) => {
            b.addEventListener('click', () => setTag(b.dataset.tag));
        });

        // Bấm một hashtag trong bài: lọc theo chủ đề đó và cuộn lên thanh lọc
        document.addEventListener('click', (e) => {
            const t = e.target.closest('.post-tag');
            if (!t || !list.contains(t)) return;
            e.preventDefault();
            setTag(t.dataset.tag);
            document.getElementById('feedToolbar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });

        more.addEventListener('click', () => {
            expanded = true;
            apply();
        });

        // Nút Theo dõi (trong bài và trong cột phải)
        document.addEventListener('click', (e) => {
            const b = e.target.closest('.follow-btn');
            if (!b) return;
            const on = b.classList.toggle('on');
            b.textContent = on ? 'Đang theo dõi' : 'Theo dõi';
            const post = b.closest('.feed-post');
            if (post) {
                post.dataset.follow = on ? '1' : '0';
                if (tab === 'follow') apply();
            }
        });

        apply();
    }

    /* ---------- 13. ĐĂNG NHẬP: KHÁCH HÀNG / ĐỐI TÁC, MÃ XÁC NHẬN ---------- */
    function setupLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const account = document.getElementById('loginAccount');
        const password = document.getElementById('loginPassword');
        const partnerCode = document.getElementById('partnerCode');
        const partnerBlock = document.getElementById('partnerBlock');
        const captchaInput = document.getElementById('captchaInput');
        const captchaCanvas = document.getElementById('captchaCanvas');
        const captchaRefresh = document.getElementById('captchaRefresh');
        const submit = document.getElementById('loginSubmit');
        const eye = document.getElementById('togglePassword');
        const title = document.getElementById('loginTitle');
        const subtitle = document.getElementById('loginSubtitle');
        const tabs = Array.from(document.querySelectorAll('.login-tab'));

        const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ các ký tự dễ nhầm: 0/O, 1/I
        const COLORS = ['#2a8c85', '#e0607a', '#6c5ce7', '#475569', '#b45309'];
        const CODE_RE = /^[A-Z0-9]{6,12}$/;
        let role = 'customer';
        let captchaText = '';

        const randInt = (n) => Math.floor(Math.random() * n);

        // Vẽ mã xác nhận: chữ xoay nhẹ, có đường nhiễu và chấm nhiễu
        const drawCaptcha = () => {
            captchaText = '';
            for (let i = 0; i < 5; i++) captchaText += CHARS[randInt(CHARS.length)];

            const ctx = captchaCanvas.getContext('2d');
            const w = captchaCanvas.width;
            const h = captchaCanvas.height;
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#e0f7fa');
            grad.addColorStop(1, '#fce7f3');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            for (let i = 0; i < 5; i++) {
                ctx.strokeStyle = COLORS[randInt(COLORS.length)];
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(randInt(w), randInt(h));
                ctx.lineTo(randInt(w), randInt(h));
                ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '700 26px Quicksand, Segoe UI, sans-serif';
            for (let i = 0; i < captchaText.length; i++) {
                ctx.save();
                ctx.translate(20 + i * 30, h / 2 + (randInt(7) - 3));
                ctx.rotate((randInt(41) - 20) * Math.PI / 180);
                ctx.fillStyle = COLORS[randInt(COLORS.length)];
                ctx.fillText(captchaText[i], 0, 0);
                ctx.restore();
            }

            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = COLORS[randInt(COLORS.length)];
                ctx.fillRect(randInt(w), randInt(h), 2, 2);
            }

            captchaInput.value = '';
            captchaInput.parentElement.closest('.login-field').classList.remove('has-error');
            captchaInput.classList.remove('is-invalid');
        };

        // Hiện hoặc ẩn lỗi của một ô nhập
        const setError = (input, bad) => {
            const field = input.closest('.login-field');
            input.classList.toggle('is-invalid', bad);
            field.classList.toggle('has-error', bad);
            return !bad;
        };

        const setRole = (r) => {
            role = r;
            tabs.forEach((t) => {
                const on = t.dataset.role === r;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            partnerBlock.hidden = r !== 'partner';
            title.textContent = r === 'partner' ? 'Khu Vực Đối Tác' : 'Chào Mừng Trở Lại';
            subtitle.textContent = r === 'partner'
                ? 'Đăng nhập để quản lý gian hàng cho thuê của bạn'
                : 'Đăng nhập để thuê, mua và chia sẻ cùng MiuCos';
            submit.textContent = r === 'partner' ? 'Đăng Nhập Đối Tác' : 'Đăng Nhập';
        };

        const validate = () => {
            let ok = true;
            ok = setError(account, account.value.trim().length < 3) && ok;
            ok = setError(password, password.value.length < 6) && ok;
            if (role === 'partner') {
                ok = setError(partnerCode, !CODE_RE.test(partnerCode.value.trim().toUpperCase())) && ok;
            }
            ok = setError(captchaInput, captchaInput.value.trim().toUpperCase() !== captchaText) && ok;
            return ok;
        };

        // Chọn tab vai trò
        tabs.forEach((t) => t.addEventListener('click', () => setRole(t.dataset.role)));

        // Đổi mã xác nhận khi bấm vào hình hoặc nút làm mới
        captchaCanvas.addEventListener('click', drawCaptcha);
        captchaRefresh.addEventListener('click', drawCaptcha);

        // Mã đối tác luôn hiện chữ in hoa
        partnerCode.addEventListener('input', () => {
            partnerCode.value = partnerCode.value.toUpperCase();
        });

        // Gõ lại ô nào thì bỏ lỗi ô đó
        [account, password, partnerCode, captchaInput].forEach((input) => {
            input.addEventListener('input', () => setError(input, false));
        });

        eye.addEventListener('click', () => {
            const show = password.type === 'password';
            password.type = show ? 'text' : 'password';
            eye.setAttribute('aria-pressed', show ? 'true' : 'false');
            eye.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
            eye.querySelector('i').className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validate()) {
                const first = [account, password, partnerCode, captchaInput]
                    .find((f) => f && f.classList.contains('is-invalid'));
                if (first) first.focus();
                if (captchaInput.classList.contains('is-invalid')) {
                    // Nhập sai mã thì đổi mã mới và làm ô nhập rung nhẹ
                    drawCaptcha();
                    captchaInput.classList.add('is-shake');
                    setTimeout(() => captchaInput.classList.remove('is-shake'), 400);
                }
                return;
            }

            // Chưa có máy chủ: chỉ mô phỏng quá trình đăng nhập
            submit.disabled = true;
            const label = submit.textContent;
            submit.textContent = 'Đang đăng nhập...';
            setTimeout(() => {
                submit.disabled = false;
                submit.textContent = label;
                showToast(role === 'partner'
                    ? 'Đã nhận thông tin đăng nhập đối tác (bản demo)'
                    : 'Đã nhận thông tin đăng nhập (bản demo)');
                drawCaptcha();
            }, reduceMotion ? 0 : 1200);
        });

        // Mở thẳng tab đối tác khi đi từ nút "Khu Vực Đối Tác"
        const params = new URLSearchParams(window.location.search);
        setRole(params.get('role') === 'partner' ? 'partner' : 'customer');
        drawCaptcha();
    }

    /* ---------- 14. NÚT NỔI: ZALO, TRỢ LÝ CHAT ĐƠN GIẢN ---------- */
    function setupFloatingButtons() {
        // THAY số Zalo thật của shop vào đây
        const ZALO_URL = 'https://zalo.me/0900000000';

        // Câu trả lời của trợ lý. Muốn đổi nội dung, sửa phần "answer" bên dưới.
        // keys: các từ khóa; nếu câu hỏi có từ khóa nào thì dùng câu trả lời đó.
        const KB = [
            { keys: ['chao', 'xin chao', 'hello'], answer: 'Chào bạn! Bạn cần hỏi về thuê đồ, mua đồ, phụ kiện, size hay tiền cọc ạ?' },
            { keys: ['thue'], answer: 'Mục Thuê Trang Phục có cosplay anime, cổ trang, truyền thống Việt Nam và concert. Bạn bấm vào mục đó trên menu để xem từng danh mục.' },
            { keys: ['mua'], answer: 'Mục Mua Trang Phục có trang phục cosplay, cổ trang, truyền thống và concert để bạn giữ lâu dài.' },
            { keys: ['phu kien', 'wig', 'dao cu', 'giay', 'non', 'trang suc'], answer: 'Mục Phụ Kiện Hóa Trang có wig, đạo cụ vũ khí, trang sức, nón mũ, giày dép và tất.' },
            { keys: ['size', 'kich co', 'vong nguc', 'vong eo'], answer: 'Bạn xem Hướng dẫn đo size chuẩn ở chân trang. Nếu vẫn chưa chắc, bấm nút Zalo bên phải để shop tư vấn số đo.' },
            { keys: ['coc', 'gia', 'bao nhieu', 'tien', 'phi'], answer: 'Giá và tiền cọc khác nhau tùy sản phẩm, bạn xem trực tiếp ở từng món. Chi tiết về cọc có trong Quy định thuê đồ & Đặt cọc ở chân trang.' },
            { keys: ['giao hang', 'ship', 'van chuyen', 'nhan do'], answer: 'Thông tin giao nhận phụ thuộc vào địa chỉ của bạn. Bạn nhắn Zalo để shop xác nhận chính xác nhé.' },
            { keys: ['doi tac', 'gian hang', 'dang ky ban'], answer: 'Bạn bấm nút Khu Vực Đối Tác ở đầu trang để đăng nhập hoặc đăng ký gian hàng cho thuê.' },
            { keys: ['dang nhap', 'tai khoan', 'mat khau', 'dang ky'], answer: 'Bạn bấm Đăng Nhập ở đầu trang. Nếu quên mật khẩu, chọn Quên mật khẩu ở trang đăng nhập.' },
            { keys: ['cong dong', 'feed', 'dang bai', 'chia se', 'outfit'], answer: 'Bạn vào mục Cộng Đồng Feed để xem và chia sẻ outfit với mọi người.' },
            { keys: ['lien he', 'hotline', 'zalo', 'sdt', 'so dien thoai', 'gap nguoi'], answer: 'Bạn nhắn Zalo bằng nút Zalo ở góc phải màn hình, hoặc gọi hotline 09xx-xxx-xxx.' },
            { keys: ['cam on', 'thanks'], answer: 'Không có gì ạ! Chúc bạn có trải nghiệm vui vẻ cùng MiuCos.' }
        ];
        const FALLBACK = 'Mình chưa hiểu câu hỏi này. Bạn thử hỏi về thuê đồ, mua đồ, phụ kiện, size, tiền cọc, đối tác hoặc đăng nhập nhé. Cần gặp người thật thì bấm nút Zalo bên phải.';
        const QUICK = ['Thuê đồ thế nào?', 'Cọc bao nhiêu?', 'Chọn size thế nào?', 'Liên hệ shop'];

        const plain = (s) => s.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Nút Zalo
        const zalo = document.createElement('a');
        zalo.className = 'float-btn float-zalo';
        zalo.href = ZALO_URL;
        zalo.target = '_blank';
        zalo.rel = 'noopener';
        zalo.title = 'Liên hệ shop qua Zalo';
        zalo.setAttribute('aria-label', 'Liên hệ shop qua Zalo');
        zalo.textContent = 'Zalo';
        document.body.appendChild(zalo);

        // Nút trợ lý
        const aiBtn = document.createElement('button');
        aiBtn.type = 'button';
        aiBtn.className = 'float-btn float-ai';
        aiBtn.title = 'Trợ lý MiuCos';
        aiBtn.setAttribute('aria-label', 'Mở trợ lý MiuCos');
        aiBtn.setAttribute('aria-expanded', 'false');
        aiBtn.innerHTML = '<i class="fa-solid fa-robot" aria-hidden="true"></i>';
        document.body.appendChild(aiBtn);

        // Khung chat
        const panel = document.createElement('section');
        panel.className = 'chat-panel';
        panel.hidden = true;
        panel.setAttribute('aria-label', 'Trợ lý MiuCos');
        panel.innerHTML =
            '<header class="chat-head">' +
                '<div><strong>Trợ lý MiuCos</strong><small>Hỏi nhanh về thuê, mua, size và cọc</small></div>' +
                '<button type="button" class="chat-close" aria-label="Đóng trợ lý"><i class="fa-solid fa-xmark"></i></button>' +
            '</header>' +
            '<div class="chat-msgs" aria-live="polite"></div>' +
            '<div class="chat-quick"></div>' +
            '<form class="chat-form">' +
                '<input type="text" class="chat-input" placeholder="Nhập câu hỏi..." aria-label="Nhập câu hỏi" maxlength="200" autocomplete="off">' +
                '<button type="submit" class="chat-send" aria-label="Gửi câu hỏi"><i class="fa-solid fa-paper-plane"></i></button>' +
            '</form>';
        document.body.appendChild(panel);

        const msgs = panel.querySelector('.chat-msgs');
        const quick = panel.querySelector('.chat-quick');
        const input = panel.querySelector('.chat-input');

        const addMsg = (text, who) => {
            const div = document.createElement('div');
            div.className = 'chat-msg ' + who;
            div.textContent = text;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
        };

        // Tìm câu trả lời có nhiều từ khóa khớp nhất
        const answer = (q) => {
            const t = plain(q);
            let best = null;
            let bestScore = 0;
            KB.forEach((item) => {
                const score = item.keys.filter((k) => t.indexOf(k) !== -1).length;
                if (score > bestScore) {
                    best = item;
                    bestScore = score;
                }
            });
            return best ? best.answer : FALLBACK;
        };

        // Lịch sử hội thoại gửi kèm mỗi câu hỏi để trợ lý hiểu ngữ cảnh
        const history = [];

        // Hỏi máy chủ /api/chat. Trả về null nếu máy chủ chưa chạy hoặc chưa có khóa.
        const askServer = async (text) => {
            history.push({ role: 'user', content: text });
            try {
                const r = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history.slice(-8) })
                });
                if (!r.ok) throw new Error('status ' + r.status);
                const data = await r.json();
                history.push({ role: 'assistant', content: data.reply });
                return data.reply;
            } catch (err) {
                history.pop();
                return null;
            }
        };

        const ask = async (q) => {
            const text = q.trim();
            if (!text) return;
            addMsg(text, 'me');
            const typing = document.createElement('div');
            typing.className = 'chat-msg bot typing';
            typing.textContent = 'Đang trả lời...';
            msgs.appendChild(typing);
            msgs.scrollTop = msgs.scrollHeight;

            const reply = await askServer(text);
            typing.remove();
            addMsg(reply || answer(text), 'bot');
        };

        QUICK.forEach((label) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.addEventListener('click', () => ask(label));
            quick.appendChild(b);
        });

        const setOpen = (open) => {
            panel.hidden = !open;
            aiBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                input.focus();
                if (!msgs.children.length) addMsg('Xin chào! Bạn muốn hỏi gì về MiuCos?', 'bot');
            }
        };

        aiBtn.addEventListener('click', () => setOpen(panel.hidden));
        panel.querySelector('.chat-close').addEventListener('click', () => setOpen(false));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) setOpen(false);
        });
        panel.querySelector('.chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const q = input.value;
            input.value = '';
            ask(q);
        });
    }

    /* ---------- 15. TRANG ĐÍCH: CHUYỂN KIỂU HIỂN THỊ CHI TIẾT / GỌN ---------- */
    function setupViewToggle() {
        const list = document.getElementById('productList');
        if (!list) return;
        const btns = Array.from(document.querySelectorAll('.view-btn'));
        const KEY = 'miucos-view';

        const apply = (view) => {
            list.classList.toggle('view-detail', view === 'detail');
            list.classList.toggle('view-compact', view === 'compact');
            btns.forEach((x) => {
                const on = x.dataset.view === view;
                x.classList.toggle('is-active', on);
                x.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        };

        btns.forEach((x) => {
            x.addEventListener('click', () => {
                apply(x.dataset.view);
                try { localStorage.setItem(KEY, x.dataset.view); } catch (e) { /* bỏ qua nếu trình duyệt chặn */ }
            });
        });

        let saved = 'detail';
        try { saved = localStorage.getItem(KEY) || 'detail'; } catch (e) { /* bỏ qua */ }
        apply(saved === 'compact' ? 'compact' : 'detail');
    }

    /* ---------- KHỞI CHẠY ---------- */
    setupScrollUI();
    setupHero();
    setupScrollers();   // chạy trước setupReveal vì hàm này bọc thêm thẻ quanh danh sách
    setupReveal();
    setupActions();
    setupSearchSuggest();
    setupMenuLinks();
    setupNavTouch();
    setupReactions();
    setupLightbox();
    setupFeed();
    setupLogin();
    setupFloatingButtons();
    setupViewToggle();
})();