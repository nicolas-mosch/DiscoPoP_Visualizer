SHELL=/bin/sh
BENCHMARK=sp
BENCHMARKU=SP

include ../config/make.def

include ../sys/make.common

ifdef binaries
OBJS = primary.o \
       ${COMMON}/print_results.o ${COMMON}/c_timers.o ${COMMON}/wtime.o

PRIMARIES = sp.o initialize.o exact_solution.o exact_rhs.o \
			set_constants.o adi.o rhs.o      \
			x_solve.o ninvr.o y_solve.o pinvr.o    \
			z_solve.o tzetar.o add.o txinvr.o error.o verify.o  
else
OBJS = primary.bc \
       ${COMMON}/print_results.bc ${COMMON}/c_timers.bc ${COMMON}/wtime.bc

PRIMARIES = sp.bc initialize.bc exact_solution.bc exact_rhs.bc \
			set_constants.bc adi.bc rhs.bc      \
			x_solve.bc ninvr.bc y_solve.bc pinvr.bc    \
			z_solve.bc tzetar.bc add.bc txinvr.bc error.bc verify.bc 
endif
# npbparams.h is included by header.h
# The following rule should do the trick but many make programs (not gmake)
# will do the wrong thing and rebuild the world every time (because the
# mod time on header.h is not changed. One solution would be to 
# touch header.h but this might cause confusion if someone has
# accidentally deleted it. Instead, make the dependency on npbparams.h
# explicit in all the lines below (even though dependence is indirect). 

# header.h: npbparams.h

${PROGRAM}: config ${OBJS}
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c header.h npbparams.h
	${CCOMPILE} $<
endif

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

sp.o:             sp.c  header.h npbparams.h
initialize.o:     initialize.c  header.h npbparams.h
exact_solution.o: exact_solution.c  header.h npbparams.h
exact_rhs.o:      exact_rhs.c  header.h npbparams.h
set_constants.o:  set_constants.c  header.h npbparams.h
adi.o:            adi.c  header.h npbparams.h
rhs.o:            rhs.c  header.h npbparams.h
#lhsx.o:           lhsx.c  header.h npbparams.h
#lhsy.o:           lhsy.c  header.h npbparams.h
#lhsz.o:           lhsz.c  header.h npbparams.h
x_solve.o:        x_solve.c  header.h npbparams.h
ninvr.o:          ninvr.c  header.h npbparams.h
y_solve.o:        y_solve.c  header.h npbparams.h
pinvr.o:          pinvr.c  header.h npbparams.h
z_solve.o:        z_solve.c  header.h npbparams.h
tzetar.o:         tzetar.c  header.h npbparams.h
add.o:            add.c  header.h npbparams.h
txinvr.o:         txinvr.c  header.h npbparams.h
error.o:          error.c  header.h npbparams.h
verify.o:         verify.c  header.h npbparams.h

sp.bc:             sp.c  header.h npbparams.h
initialize.bc:     initialize.c  header.h npbparams.h
exact_solution.bc: exact_solution.c  header.h npbparams.h
exact_rhs.bc:      exact_rhs.c  header.h npbparams.h
set_constants.bc:  set_constants.c  header.h npbparams.h
adi.bc:            adi.c  header.h npbparams.h
rhs.bc:            rhs.c  header.h npbparams.h
#lhsx.bc:           lhsx.c  header.h npbparams.h
#lhsy.bc:           lhsy.c  header.h npbparams.h
#lhsz.bc:           lhsz.c  header.h npbparams.h
x_solve.bc:        x_solve.c  header.h npbparams.h
ninvr.bc:          ninvr.c  header.h npbparams.h
y_solve.bc:        y_solve.c  header.h npbparams.h
pinvr.bc:          pinvr.c  header.h npbparams.h
z_solve.bc:        z_solve.c  header.h npbparams.h
tzetar.bc:         tzetar.c  header.h npbparams.h
add.bc:            add.c  header.h npbparams.h
txinvr.bc:         txinvr.c  header.h npbparams.h
error.bc:          error.c  header.h npbparams.h
verify.bc:         verify.c  header.h npbparams.h

clean:
	- rm -f *.o *~ mputil*
	- rm -f npbparams.h core
