SHELL=/bin/sh
BENCHMARK=ft
BENCHMARKU=FT

include ../config/make.def

include ../sys/make.common

ifdef binaries
PRIMARIES = appft.o auxfnct.o fft3d.o mainft.o verify.o 

OBJS = primary.o \
       ${COMMON}/${RAND}.o ${COMMON}/print_results.o \
       ${COMMON}/c_timers.o ${COMMON}/wtime.o
else
PRIMARIES = appft.bc auxfnct.bc fft3d.bc mainft.bc verify.bc 

OBJS = primary.bc \
       ${COMMON}/${RAND}.bc ${COMMON}/print_results.bc \
       ${COMMON}/c_timers.bc ${COMMON}/wtime.bc
endif

${PROGRAM}: config ${OBJS}
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c global.h npbparams.h
	${CCOMPILE} $<
endif

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

appft.o:	appft.c  global.h npbparams.h
auxfnct.o:	auxfnct.c  global.h npbparams.h
fft3d.o:	fft3d.c  global.h npbparams.h
mainft.o:	mainft.c  global.h npbparams.h
verify.o:	verify.c  global.h npbparams.h

appft.bc:	appft.c  global.h npbparams.h
auxfnct.bc:	auxfnct.c  global.h npbparams.h
fft3d.bc:	fft3d.c  global.h npbparams.h
mainft.bc:	mainft.c  global.h npbparams.h
verify.bc:	verify.c  global.h npbparams.h

clean:
	- rm -f *.o *.bc *~ mputil*
	- rm -f ft npbparams.h core
