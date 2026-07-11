import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SignalField from '../Hero/SignalField'

// 佔位資歷 —— 待替換為真實任職公司/期間/職稱
const jobs = [
  { year: 'Now',   company: 'Company Name',   duration: 'X yrs · Present', role: 'SRE / DevOps Engineer' },
  { year: 'Prior', company: 'Company Name',   duration: 'X yrs X months',  role: 'Backend Developer' },
  { year: 'Prior', company: 'Company Name',   duration: 'X months',       role: 'Cloud / Infra Intern' },
]

export default function WorkTimeline() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      className="section-padding"
      style={{ background: 'var(--bg-primary)', position: 'relative', overflow: 'visible' }}
    >
      <SignalField />
      <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <p className="path-label" style={{ marginBottom: 14, justifyContent: 'center' }}>work</p>
          <h2 className="text-headline">Career Timeline</h2>
        </motion.div>

        <div className="timeline">
          {jobs.map((job, i) => (
            <motion.div
              key={`${job.company}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="timeline-job"
            >
              <div className="timeline-year">{job.year}</div>
              <div className="timeline-body">
                <h4>{job.company}</h4>
                <p className="timeline-dur">{job.duration}</p>
                <p className="timeline-role">{job.role}</p>
              </div>
            </motion.div>
          ))}
          <div className="timeline-total">
            <span className="k">total experience</span>
            <span className="v">X years X months</span>
          </div>
        </div>
      </div>
    </section>
  )
}
