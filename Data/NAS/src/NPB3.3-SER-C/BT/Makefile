SHELL=/bin/sh
BENCHMARK=bt
BENCHMARKU=BT
VEC=

include ../config/make.def

include ../sys/make.common

ifdef binaries
OBJS = primary.o \
       ${COMMON}/print_results.o ${COMMON}/c_timers.o ${COMMON}/wtime.o

PRIMARIES = bt.o  initialize.o exact_solution.o exact_rhs.o \
			set_constants.o adi.o  rhs.o      \
			x_solve$(VEC).o y_solve$(VEC).o solve_subs.o  \
			z_solve$(VEC).o add.o error.o verify.o 
else
OBJS = primary.bc \
       ${COMMON}/print_results.bc ${COMMON}/c_timers.bc ${COMMON}/wtime.bc

PRIMARIES = bt.bc  initialize.bc exact_solution.bc exact_rhs.bc \
			set_constants.bc adi.bc  rhs.bc      \
			x_solve$(VEC).bc y_solve$(VEC).bc solve_subs.bc  \
			z_solve$(VEC).bc add.bc error.bc verify.bc 
endif

# npbparams.h is included by header.h
# The following rule should do the trick but many make programs (not gmake)
# will do the wrong thing and rebuild the world every time (because the
# mod time on header.h is not changed. One solution would be to 
# touch header.h but this might cause confusion if someone has
# accidentally deleted it. Instead, make the dependency on npbparams.h
# explicit in all the lines below (even though dependence is indirect). 

# header.h: npbparams.h

${PROGRAM}: config
	@if [ x$(VERSION) = xvec ] ; then	\
		${MAKE} VEC=_vec exec;		\
	elif [ x$(VERSION) = xVEC ] ; then	\
		${MAKE} VEC=_vec exec;		\
	else					\
		${MAKE} exec;			\
	fi

exec: $(OBJS)
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c
	${CCOMPILE} $<
endif

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

bt.o:             bt.c  header.h npbparams.h
initialize.o:     initialize.c  header.h npbparams.h
exact_solution.o: exact_solution.c  header.h npbparams.h
exact_rhs.o:      exact_rhs.c  header.h npbparams.h
set_constants.o:  set_constants.c  header.h npbparams.h
adi.o:            adi.c  header.h npbparams.h
rhs.o:            rhs.c  header.h npbparams.h
x_solve$(VEC).o:  x_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
y_solve$(VEC).o:  y_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
z_solve$(VEC).o:  z_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
solve_subs.o:     solve_subs.c  npbparams.h
add.o:            add.c  header.h npbparams.h
error.o:          error.c  header.h npbparams.h
verify.o:         verify.c  header.h npbparams.h

bt.bc:             bt.c  header.h npbparams.h
initialize.bc:     initialize.c  header.h npbparams.h
exact_solution.bc: exact_solution.c  header.h npbparams.h
exact_rhs.bc:      exact_rhs.c  header.h npbparams.h
set_constants.bc:  set_constants.c  header.h npbparams.h
adi.bc:            adi.c  header.h npbparams.h
rhs.bc:            rhs.c  header.h npbparams.h
x_solve$(VEC).bc:  x_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
y_solve$(VEC).bc:  y_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
z_solve$(VEC).bc:  z_solve$(VEC).c  header.h work_lhs$(VEC).h npbparams.h
solve_subs.bc:     solve_subs.c  npbparams.h
add.bc:            add.c  header.h npbparams.h
error.bc:          error.c  header.h npbparams.h
verify.bc:         verify.c  header.h npbparams.h

clean:
	- rm -f *.o *.bc *~ mputil*
	- rm -f  npbparams.h core
