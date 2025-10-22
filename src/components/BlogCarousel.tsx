import { useState, useEffect } from 'react';
import type { CollectionEntry } from 'astro:content';

interface Props {
  posts: Array<{
    id: string;
    data: CollectionEntry<'blog'>['data'];
  }>;
}

export default function BlogCarousel({ posts }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // 自动轮播
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, posts.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false); // 手动切换后暂停自动播放
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
    setIsAutoPlay(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-us', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{
              transform: `translateX(${(index - currentIndex) * 100}%)`,
            }}
          >
            <a href={`/blog/${post.id}/`} className="slide-link">
              <div className="slide-image-wrapper">
                {post.data.heroImage && (
                  <img
                    src={post.data.heroImage.src}
                    alt={post.data.title}
                    className="slide-image"
                  />
                )}
                <div className="slide-overlay"></div>
              </div>
              <div className="slide-content">
                <h2 className="slide-title">{post.data.title}</h2>
                <p className="slide-description">{post.data.description}</p>
                <time className="slide-date">{formatDate(post.data.pubDate)}</time>
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* 导航按钮 */}
      <button
        onClick={goToPrev}
        className="carousel-btn carousel-btn-prev"
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        onClick={goToNext}
        className="carousel-btn carousel-btn-next"
        aria-label="Next slide"
      >
        ›
      </button>

      {/* 指示器 */}
      <div className="carousel-indicators">
        {posts.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <style>{`
        .carousel-container {
          position: relative;
          width: 100%;
          height: 600px;
          overflow: hidden;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .carousel-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          pointer-events: none;
        }

        .carousel-slide.active {
          opacity: 1;
          pointer-events: all;
        }

        .slide-link {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
          position: relative;
        }

        .slide-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .slide-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.4) 50%,
            transparent 100%
          );
        }

        .slide-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 3rem;
          color: white;
          z-index: 10;
        }

        .slide-title {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          transition: transform 0.3s ease;
        }

        .slide-link:hover .slide-title {
          transform: translateY(-5px);
        }

        .slide-description {
          font-size: 1.2rem;
          margin: 0 0 1rem 0;
          opacity: 0.95;
          max-width: 600px;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }

        .slide-date {
          font-size: 0.95rem;
          opacity: 0.8;
          display: block;
        }

        /* 导航按钮 */
        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 3rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          padding: 0;
        }

        .carousel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-btn-prev {
          left: 2rem;
        }

        .carousel-btn-next {
          right: 2rem;
        }

        /* 指示器 */
        .carousel-indicators {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.75rem;
          z-index: 20;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.6);
          transform: scale(1.2);
        }

        .indicator.active {
          background: white;
          width: 30px;
          border-radius: 6px;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .carousel-container {
            height: 500px;
            border-radius: 10px;
          }

          .slide-content {
            padding: 2rem 1.5rem;
          }

          .slide-title {
            font-size: 2rem;
          }

          .slide-description {
            font-size: 1rem;
          }

          .carousel-btn {
            width: 50px;
            height: 50px;
            font-size: 2rem;
          }

          .carousel-btn-prev {
            left: 1rem;
          }

          .carousel-btn-next {
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

