'use client';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export function useStory() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.from('.hero-copy > *', {
          y: 35,
          opacity: 0,
          duration: 0.95,
          stagger: 0.09,
          ease: 'power3.out',
        });
        gsap.from('.hero-illustration', {
          scale: 0.88,
          rotation: 8,
          opacity: 0,
          duration: 1.4,
          ease: 'power3.out',
        });
        gsap.from('.orbit-chip', {
          scale: 0.6,
          y: 20,
          opacity: 0,
          stagger: 0.13,
          delay: 0.45,
          duration: 0.8,
          ease: 'back.out(1.3)',
        });
        gsap.to('.scroll-progress', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: 'main',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          if (el.querySelector('button, input, summary, select, textarea, a'))
            return;
          gsap.from(el, {
            y: 24,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 94%', once: true },
          });
        });
        gsap.from('.transform-step', {
          y: 60,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          scrollTrigger: {
            trigger: '.transform-steps',
            start: 'top 88%',
            once: true,
          },
        });
        gsap.from('.process-line i', {
          scaleX: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.process-cards',
            start: 'top 85%',
            end: 'bottom 50%',
            scrub: 0.8,
          },
        });
      });
      return () => ctx.revert();
    });
    media.add(
      '(min-width: 1024px) and (min-height: 750px) and (prefers-reduced-motion: no-preference)',
      () => {
        const stage = document.querySelector<HTMLElement>('.signature-stage');
        const panels = gsap.utils.toArray<HTMLElement>('.signature-panel');
        const ctx = gsap.context(() => {
          if (stage && panels.length) {
            stage.classList.add('is-animated');
            gsap.set(panels.slice(1), { yPercent: 110 });
            panels.forEach((panel, i) => {
              panel.inert = i !== 0;
            });
            const timeline = gsap.timeline({
              scrollTrigger: {
                id: 'studio-chapters',
                trigger: stage,
                start: 'top 95px',
                end: '+=1800',
                scrub: 0.7,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  const active = Math.min(
                    panels.length - 1,
                    Math.floor(self.progress * panels.length),
                  );
                  panels.forEach((panel, i) => {
                    panel.inert = i !== active;
                  });
                },
              },
            });
            panels.slice(1).forEach((panel, i) => {
              timeline
                .to(
                  panels[i],
                  {
                    scale: 0.92,
                    yPercent: -4,
                    opacity: 0.4,
                    duration: 1,
                    ease: 'none',
                  },
                  i,
                )
                .to(panel, { yPercent: 0, duration: 1, ease: 'none' }, i);
            });
            timeline.fromTo(
              '.signature-progress i',
              { scaleX: 0 },
              { scaleX: 1, duration: panels.length - 1, ease: 'none' },
              0,
            );
          }
          gsap.to('.hero-illustration', {
            y: -60,
            rotation: -7,
            scale: 0.94,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hero',
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
            },
          });
          gsap.to('.orbit-chip', {
            y: 90,
            rotation: 18,
            stagger: 0.08,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hero',
              start: 'top top',
              end: 'bottom top',
              scrub: 1.4,
            },
          });
          gsap.to('.hero-art .float-card', {
            y: -95,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hero',
              start: 'top top',
              end: 'bottom top',
              scrub: 1.1,
            },
          });
          gsap.utils.toArray<HTMLElement>('.signature-art img').forEach((el) =>
            gsap.fromTo(
              el,
              { rotation: 5, scale: 0.96 },
              {
                rotation: -5,
                scale: 1.04,
                ease: 'none',
                scrollTrigger: {
                  trigger: stage,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1,
                },
              },
            ),
          );
        });
        return () => {
          ctx.revert();
          stage?.classList.remove('is-animated');
          panels.forEach((panel) => {
            panel.inert = false;
          });
        };
      },
    );
    const refresh = () => ScrollTrigger.refresh();
    const observer = new ResizeObserver(refresh);
    document
      .querySelectorAll('.service-card,.faq-list')
      .forEach((el) => observer.observe(el));
    let disposed = false;
    document.fonts.ready.then(() => {
      if (!disposed) refresh();
    });
    window.addEventListener('load', refresh);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener('load', refresh);
      media.revert();
    };
  }, []);
}
