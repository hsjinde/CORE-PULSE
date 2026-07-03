import { useEffect } from 'react'
import Lenis from 'lenis'
import { registerLenis } from '@/lib/lenisController'
import Navbar from '@/components/Navbar/Navbar'
import Hero from '@/components/Hero/Hero'
import BentoGrid from '@/components/Bento/BentoGrid'
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

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      registerLenis(null)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <Projects />
        <Blog />
      </main>
      <Footer />
    </>
  )
}
