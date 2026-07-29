import { useEffect } from 'react'
import Lenis from 'lenis'
import { registerLenis } from '@/lib/lenisController'
import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import About from '@/components/About/About'
import BentoGrid from '@/components/Bento/BentoGrid'
import WorkTimeline from '@/components/WorkTimeline/WorkTimeline'
import Projects from '@/components/Projects/Projects'
import Blog from '@/components/Blog/Blog'
import Footer from '@/components/Footer/Footer'

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    registerLenis(lenis)

    /* rAF handle 要留著 —— 原本 cleanup 只呼叫 lenis.destroy(),遞迴的 raf 沒被取消,
       於是每次離開首頁都遺留一個永遠跑下去的迴圈(還在對已銷毀的實例呼叫 .raf())。
       首頁 → 文章 → 首頁 來回幾次就疊了好幾層,主執行緒被白吃。 */
    let handle = 0
    function raf(time: number) {
      lenis.raf(time)
      handle = requestAnimationFrame(raf)
    }

    handle = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(handle)
      registerLenis(null)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Navbar />
      <div className="site-frame">
        <main>
          <Hero />
          <About />
          <BentoGrid />
          <WorkTimeline />
          <Projects />
          <Blog />
        </main>
        <Footer />
      </div>
    </>
  )
}
