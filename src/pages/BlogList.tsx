import Navbar from '@/components/Navbar/Navbar'
import Blog from '@/components/Blog/Blog'
import Footer from '@/components/Footer/Footer'

export default function BlogList() {
  return (
    <>
      <Navbar />
      <div className="site-frame">
        <main>
          <Blog />
        </main>
        <Footer />
      </div>
    </>
  )
}
