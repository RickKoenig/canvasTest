#if 0
// some car physics
#include <math.h>
#include <string.h>
#include <float.h>
#include <stdio.h>
#include <stdlib.h>
//#include <engine1.h>

//#include "user20.h"

// export to debprint
float frictshock20;
float frictother20;
float shockstr20;
float shockdamp20;
enum {COAST,BRAKE,ACCEL};
int drivemode20;
float accelspin20,startaccelspin20;
int selobject20=-1;
static int lastmbut;
int scllock20=1;
float zoom20=1;

// try to keep (X1-X0)/(Y1-Y0) at 4/3
static float view_x0=-50.0f;
static float view_x1=50.0f;
static float view_y0=-37.5f;
static float view_y1=37.5f;
struct pointf2 view_center20;
static float view_grid=10;

#define FPS 30
#define TINC (1/30.0f)
float timeinc20;
int iterloop20;
static struct pointf2 fcursor;
static int framecount;
//#define epsilon 1.0e-15f
#define WHEELRAD 1.25f
int smartroad20;


#define TESTSET1
//#define TESTSET2

#define FR1 .5f
//#define FR1 3.5f
//#define LITTLEG 1.80f
#define LITTLEG 9.80f
#define AIRFRIC .001f
#define ELAST .8f // .5 to 1
static float impamount=3; // drive the car
#define NPOINTS (6+4) // 6 for rect, 4 for shocks
#define NRECTPOINTS 6
#define NSHOCKPOINTS 4
#define NSHOCKS 2
#define POWERSHOCK 0

#define MAXROAD 500
#define ROADPEN 15 // how deep you can penatrate the road and still get a collision
#define NORMALSHOCKLEN 1.5f
#define SHOCKSPACING 4.5
//#define SHOCKSTRENGTH 1
struct object {
////// fundamental
// type
// cosmetic
	int color;
// position of cm
	struct pointf2 pos;
// shape of object
	struct pointf2 len; // lenx is also radius
// total mass
	float mass; // mass of 0 is infinite
// rotation
	float ang;
// time related
	struct pointf2 vel;
	float velang;	//rads per sec, about cm
// friction
//	float cof; // contact friction coeff
/////////// derived points
	float moi;	// moment of inertia about cm
	float shocklen[NSHOCKS];
	int startroad,endroad;	// for smartroad
// drawing and collision points
	struct pointf2 p[NPOINTS];
	struct pointf2 pr[NPOINTS];
// wheel spin
	float wheelang[NSHOCKS];
	float wheelvel[NSHOCKS];
// bounding box
	struct pointf2 bb0,bb1;
//	int nograv;
};

static struct object iobjects[]={
//      color,     x,   y, lenx, leny, mass,         ang, velx, vely,       velang,coef of fric
#ifdef TESTSET1
	{   white,    30,   0,    6, 1.25,    1,           0, .01f,    0,  TWOPI/64.0f,        FR1},
	{   white,    15,   0,    6, 1.25,    1,           0, .01f,    0,  TWOPI/64.0f,        FR1},
	{   white,     0,   0,    6, 1.25,    1,           0, .01f,    0,  TWOPI/64.0f,        FR1},
	{   white,   -15,   0,    6, 1.25,    1,  TWOPI/8.0f, .01f,    0,            0,        FR1},
	{   white,   -30,   0,    6, 1.25,    1,           0, .01f,    0,  TWOPI/64.0f,        FR1},
#endif
// border
	{     red, -1000,   0,   30, 1500,    0,           0,    0,    0,            0,        FR1},
	{     red,  1000,   0,   30, 1500,    0,           0,    0,    0,            0,        FR1},
	{   green,     0,-750, 2000,   30,    0,           0,    0,    0,            0,        FR1},
	{   green,     0, 750, 2000,   30,    0,           0,    0,    0,            0,        FR1},
//      color,     x,   y, lenx, leny, mass,         ang, velx, vely,       velang,coef of fric
};

#define NOBJECTS (sizeof(iobjects)/sizeof(iobjects[0]))
static struct object objects[NOBJECTS];

static struct pointf2 road[MAXROAD]={
	-100, 10,
	-100,-40,
	 -70,-40,
	 -40,-30,
	 -20,-10,
	   0,-10,
	   0,-15,
	  30,-15,
	  40,-20,
	  50,-20,
	  55,-10,
	  60,-20,
	  70,-20,
	  80,-30,
	 100,-30,
	 100, 20,
};
int nroad=16;
//#define NROAD (sizeof(road)/sizeof(road[0]))

/////////////// utils
static void interp2d(struct pointf2 *a,struct pointf2 *b,float t,struct pointf2 *i)
{
	i->x=a->x+(b->x-a->x)*t;
	i->y=a->y+(b->y-a->y)*t;
}

static int getintersection2d(struct pointf2 *la,struct pointf2 *lb,
					   struct pointf2 *lc,struct pointf2 *ld,struct pointf2 *i0)
{
	float det,e,f,g,h,j,k,t0,t1;
	e=lb->x-la->x;
	f=lc->x-ld->x;
	g=lc->x-la->x;
	h=lb->y-la->y;
	j=lc->y-ld->y;
	k=lc->y-la->y;
	det=e*j-f*h;
	if (det==0)
		return 0;
	det=1/det;
	t0=(g*j-f*k)*det;
	t1=-(g*h-e*k)*det;
	if (t0>=0 && t0<1 && t1>=0 && t1<1) {
		if (i0) {
			i0->x=la->x+(lb->x-la->x)*t0;
			i0->y=la->y+(lb->y-la->y)*t0;
		}
		return 1;
	}
	return 0;
}

static float cross2d(struct pointf2 *a,struct pointf2 *b)
{
	return a->x*b->y-a->y*b->x;
}

static float dot2d(struct pointf2 *a,struct pointf2 *b)
{
	return a->x*b->x+a->y*b->y;
}

static int proj2d(struct pointf2 *a,struct pointf2 *b,struct pointf2 *pr)
{
	float k,d;
	k=dot2d(a,b);
	d=dot2d(b,b);
	if (d<EPSILON)
		return 0;
	k=k/d;
	pr->x=k*b->x;
	pr->y=k*b->y;
	return 1;
}

static float dist2d(struct pointf2 *a,struct pointf2 *b)
{
	struct pointf2 d;
	d.x=a->x-b->x;
	d.y=a->y-b->y;
	return (float)sqrt(d.x*d.x+d.y*d.y);
}

static float dist2dsq(struct pointf2 *a,struct pointf2 *b)
{
	struct pointf2 d;
	d.x=a->x-b->x;
	d.y=a->y-b->y;
	return d.x*d.x+d.y*d.y;
}

static float normalize2d(struct pointf2 *a)
{
	float r,r2;
	r=(float)sqrt(a->x*a->x+a->y*a->y);
	if (r<EPSILON)
		return 0;
	r2=1/r;
	a->x*=r2;
	a->y*=r2;
	return r;
}

static void rotpoints2d(struct pointf2 *p,struct pointf2 *pr,float ang,int np)
{
	int i;
	float fc,fs;
	fs=(float)sin((double)ang);
	fc=(float)cos((double)ang);
	for (i=0;i<np;i++,p++,pr++) {
		pr->x=fc*p->x-fs*p->y;
		pr->y=fc*p->y+fs*p->x;
	}
}

static float normangrad(float ang)
{
	if (ang>TWOPI)
		ang-=TWOPI;
	else if (ang<0.0f)
		ang+=TWOPI;
	return ang;
}

static int ftoix(float x)
{
	return (int)((x-view_center20.x-view_x0)*(WX-1)/(view_x1-view_x0));
}

static int ftoiy(float y)
{
	return (int)((y-view_center20.y-view_y1)*(WY-1)/(view_y0-view_y1));
}

static int frtoir(float r)
{
	return (int)(r*(WX-1)/(view_x1-view_x0));
}

static float itofx(int x)
{
	return (float)x*(view_x1-view_x0)/(float)(WX-1)+view_x0+view_center20.x;
}

static float itofy(int y)
{
	return (float)y*(view_y0-view_y1)/(float)(WY-1)+view_y1+view_center20.y;
}

static int pointinbbox(struct pointf2 *p,struct pointf2 *b0,struct pointf2 *b1)
{
	if (p->x<b0->x)
		return 0;
	if (p->y<b0->y)
		return 0;
	if (p->x>=b1->x)
		return 0;
	if (p->y>=b1->y)
		return 0;
	return 1;
}

static int bboxinbbox(struct object *a,struct object *b)
{
	if (a->bb1.x<b->bb0.x)
		return 0;
	if (a->bb1.y<b->bb0.y)
		return 0;
	if (a->bb0.x>=b->bb1.x)
		return 0;
	if (a->bb0.y>=b->bb1.y)
		return 0;
	return 1;
}

static int findobject()
{
	int i;
	struct pointf2 p,rp;
	for (i=0;i<NOBJECTS;i++)
		if (pointinbbox(&fcursor,&objects[i].bb0,&objects[i].bb1)) {
			p.x=fcursor.x-objects[i].pos.x;
			p.y=fcursor.y-objects[i].pos.y;
			rp.x=p.x*(float)cos(objects[i].ang)+p.y*(float)sin(objects[i].ang);
			rp.y=p.y*(float)cos(objects[i].ang)-p.x*(float)sin(objects[i].ang);
			if (rp.x>objects[i].p[0].x && rp.x<objects[i].p[3].x &&
				rp.y>objects[i].p[0].y && rp.y<objects[i].p[3].y) {
				return i;
			}
		}
	return -1;
}

static void updatesmartroad(struct object *ob)
{
	int i;
	int bi=-1;
	float distsq;
	float bdistsq;
	float den,t;
	struct pointf2 roaddel;
	struct pointf2 pmr0,rn;
	if (smartroad20)
		for (i=ob->startroad;i<ob->endroad-1;i++) {
			roaddel.x=road[i+1].x-road[i].x;
			roaddel.y=road[i+1].y-road[i].y;
			pmr0.x=ob->pos.x-road[i].x;
			pmr0.y=ob->pos.y-road[i].y;
			den=dot2d(&roaddel,&roaddel);
			if (den>EPSILON) {
				t=dot2d(&roaddel,&pmr0)/den;
				if (t>0 && t<1) {
					rn.x=t*roaddel.x+road[i].x;
					rn.y=t*roaddel.y+road[i].y;
					distsq=dist2dsq(&rn,&ob->pos);
					if (bi==-1 || distsq<bdistsq) {
						bdistsq=distsq;
						bi=i;
					}
				}
			}
		}
		for (i=ob->startroad;i<ob->endroad;i++) {
			distsq=dist2dsq(&road[i],&ob->pos);
			if (bi==-1 || distsq<bdistsq) {
				bdistsq=distsq;
				bi=i;
			}
		}
	if (bi>=0) {
		ob->startroad=max(0,bi-5);
		ob->endroad=min(nroad,bi+5);
	} else if (!smartroad20) {
		ob->startroad=0;
		ob->endroad=nroad;
	}

}

/////////////////////////// collisions
static void calccollisioninfo() // also updates stuff needed for drawing
{
	int i,j;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++) {
		updatesmartroad(op);
		op->p[0].x=-op->len.x/2; // ccw
		op->p[0].y=0;
		op->p[1].x=0; // ccw
		op->p[1].y=0;
		op->p[2].x=op->len.x/2;
		op->p[2].y=0;
		op->p[3].x=op->len.x/2;
		op->p[3].y=op->len.y;
		op->p[4].x=0;
		op->p[4].y=op->len.y;
		op->p[5].x=-op->len.x/2;
		op->p[5].y=op->len.y;

		op->p[6].x=-SHOCKSPACING/2;
		op->p[6].y=0;
		op->p[7].x=-SHOCKSPACING/2;
		op->p[7].y=-NORMALSHOCKLEN;
		op->p[8].x=SHOCKSPACING/2;
		op->p[8].y=0;
		op->p[9].x=SHOCKSPACING/2;
		op->p[9].y=-NORMALSHOCKLEN;
		rotpoints2d(op->p,op->pr,op->ang,NPOINTS);
		op->bb0.x=op->bb1.x=op->pos.x+op->pr[0].x;
		op->bb0.y=op->bb1.y=op->pos.y+op->pr[0].y;
		for (j=1;j<NRECTPOINTS;j++) {
			op->bb0.x=min(op->bb0.x,op->pos.x+op->pr[j].x);
			op->bb0.y=min(op->bb0.y,op->pos.y+op->pr[j].y);
			op->bb1.x=max(op->bb1.x,op->pos.x+op->pr[j].x);
			op->bb1.y=max(op->bb1.y,op->pos.y+op->pr[j].y);
		}
		op->moi=op->mass*(op->len.x*op->len.x/12.0f+op->len.y*op->len.y/3.0f);
	}
}

// new elegant improved also sets bestpendir of force of a on b
// given objects a and b, returns contact point and unit vector of direction of force of a on b
static int colliding(struct object *a,struct object *b,struct pointf2 *bestcp,struct pointf2 *bestpendir)
{
	int i,j,k;
	struct pointf2 la0,la1,lb0,lb1;
	struct pointf2 is[NRECTPOINTS*NRECTPOINTS];
	float dx,dy;
	float dist01,dist12,dist20;
	k=0;
	for (i=0;i<NRECTPOINTS;i++) {
		la0.x=a->pos.x+a->pr[i].x;
		la0.y=a->pos.y+a->pr[i].y;
		la1.x=a->pos.x+a->pr[(i+1)%NRECTPOINTS].x;
		la1.y=a->pos.y+a->pr[(i+1)%NRECTPOINTS].y;
		for (j=0;j<NRECTPOINTS;j++) {
			lb0.x=b->pos.x+b->pr[j].x;
			lb0.y=b->pos.y+b->pr[j].y;
			lb1.x=b->pos.x+b->pr[(j+1)%NRECTPOINTS].x;
			lb1.y=b->pos.y+b->pr[(j+1)%NRECTPOINTS].y;
			if (getintersection2d(&la0,&la1,&lb0,&lb1,&is[k])) {
				clipcircle(B8,ftoix(is[k].x),ftoiy(is[k].y),5,black);
				k++;
			}
		}
	}
	if (k<2)
		return 0;
	if (k>4)
//		errorexit("too many intersections (%d) obj %d to obj %d frame %d",k,a-objects,b-objects,framecount);
		return 0;
	if (k==3) {// find closest intersections and merge together, rare
		dx=is[0].x-is[1].x;
		dy=is[0].y-is[1].y;
		dist01=dx*dx+dy*dy;
		dx=is[1].x-is[2].x;
		dy=is[1].y-is[2].y;
		dist12=dx*dx+dy*dy;
		dx=is[2].x-is[0].x;
		dy=is[2].y-is[0].y;
		dist20=dx*dx+dy*dy;
		if (dist01<dist12) {
			if (dist01<dist20) {
				is[0].x=(is[0].x+is[1].x)/2;
				is[0].y=(is[0].y+is[1].y)/2;
				is[1]=is[2];
			} else {
				is[0].x=(is[0].x+is[2].x)/2;
				is[0].y=(is[0].y+is[2].y)/2;
			}
		} else {
			if (dist12<dist20) {
				is[1].x=(is[1].x+is[2].x)/2;
				is[1].y=(is[1].y+is[2].y)/2;
			} else {
				is[0].x=(is[0].x+is[2].x)/2;
				is[0].y=(is[0].y+is[2].y)/2;
			}
		}
	} else if (k==4) { // very very rare 
		return 0;
	}
	bestcp->x=(is[0].x+is[1].x)/2;
	bestcp->y=(is[0].y+is[1].y)/2;
	bestpendir->x=is[0].y-is[1].y;
	bestpendir->y=is[1].x-is[0].x;
	if (!normalize2d(bestpendir))
		return 0;
	// reuse la0 
	la0.x=bestcp->x-a->pos.x;
	la0.y=bestcp->y-a->pos.y;
	if (dot2d(&la0,bestpendir)<0) {
		bestpendir->x=-bestpendir->x;
		bestpendir->y=-bestpendir->y;
	}
	return 1;
}

// given objects oi and oj and local collision points and direction of unit force of oi on oj
// return magnitude of force and return force of oi on oj
static float collbox2box(struct object *oi,struct object *oj,
						struct pointf2 *r1,struct pointf2 *r2,struct pointf2 *impdir,
						struct pointf2 *impdircontact)
{
	float imp;
	float r1cd,r2cd;
	if (oi->mass==0) {
		r2cd=cross2d(r2,impdir);
		imp=2*(-dot2d(&oj->vel,impdir)-oj->velang*r2cd)/
			(1/oj->mass+r2cd*r2cd/oj->moi);
	} else if (oj->mass==0) {
		r1cd=cross2d(r1,impdir);
		imp=2*(dot2d(&oi->vel,impdir)+oi->velang*r1cd)/
			(1/oi->mass+r1cd*r1cd/oi->moi);
	} else {
		r1cd=cross2d(r1,impdir);
		r2cd=cross2d(r2,impdir);
		imp=2*(dot2d(&oi->vel,impdir)-dot2d(&oj->vel,impdir)+oi->velang*r1cd-oj->velang*r2cd)/
			(1/oi->mass+1/oj->mass+r1cd*r1cd/oi->moi+r2cd*r2cd/oj->moi);
	}
	imp*=ELAST;
	impdircontact->x=imp*impdir->x;
	impdircontact->y=imp*impdir->y;
	return (float)fabs(imp);
}

static float collbox2road(struct object *oi,
						struct pointf2 *r1,struct pointf2 *impdir,
						struct pointf2 *impdircontact)
{
	float imp;
	float r1cd;
	r1cd=cross2d(r1,impdir);
	imp=-2*(dot2d(&oi->vel,impdir)+oi->velang*r1cd)/
		(1/oi->mass+r1cd*r1cd/oi->moi);
	imp*=ELAST;
	impdircontact->x=imp*impdir->x;
	impdircontact->y=imp*impdir->y;
	return (float)fabs(imp);
}

// given objects oi and oj and local collision points and direction of unit force of oi on oj
// and magnitude of contact force
// return frictional force of oi on oj
static void fricbox2box(struct object *oi,struct object *oj,
				 struct pointf2 *r1,struct pointf2 *r2,struct pointf2 *impdir,float contact,struct pointf2 *impdirfric)
{
	struct pointf2 va,vb,r1p,r2p;
	float impfric;
	float dt;
	float chs;
//	float coef=min(oi->cof,oj->cof);
	float coef=frictother20;
	if (coef==0) {
		impdirfric->x=0;
		impdirfric->y=0;
		return;
	}
	impdirfric->x=-impdir->y;
	impdirfric->y=impdir->x;
	r1p.x=-r1->y;
	r1p.y=r1->x;
	r2p.x=-r2->y;
	r2p.y=r2->x;
	va.x=(oi->vel.x+oi->velang*r1p.x)-(oj->vel.x+oj->velang*r2p.x);
	va.y=(oi->vel.y+oi->velang*r1p.y)-(oj->vel.y+oj->velang*r2p.y);
	if (oi->mass==0) {
		vb.x=impdirfric->x/oj->mass+r2p.x*cross2d(r2,impdirfric)/oj->moi;
		vb.y=impdirfric->y/oj->mass+r2p.y*cross2d(r2,impdirfric)/oj->moi;
	} else if (oj->mass==0) {
		vb.x=impdirfric->x/oi->mass+r1p.x*cross2d(r1,impdirfric)/oi->moi;
		vb.y=impdirfric->y/oi->mass+r1p.y*cross2d(r1,impdirfric)/oi->moi;
	} else {
		vb.x=(impdirfric->x/oi->mass+r1p.x*cross2d(r1,impdirfric)/oi->moi)+
			 (impdirfric->x/oj->mass+r2p.x*cross2d(r2,impdirfric)/oj->moi);
		vb.y=(impdirfric->y/oi->mass+r1p.y*cross2d(r1,impdirfric)/oi->moi)+
			 (impdirfric->y/oj->mass+r2p.y*cross2d(r2,impdirfric)/oj->moi);
	}
	dt=dot2d(&vb,impdirfric);
//	if (0) {
	if (dt) {
		impfric=dot2d(&va,impdirfric)/dt; 
		if (impfric>=0)
			chs=1;
		else
			chs=-1;
		if (impfric*chs>coef*contact)
			impfric=chs*coef*contact;
		impdirfric->x*=impfric;
		impdirfric->y*=impfric;
	} else {
		impdirfric->x=0;
		impdirfric->y=0;
	}
}

static void fricbox2road(int shn,float frc,struct object *oi,
				 struct pointf2 *r1,struct pointf2 *impdir,float contact,struct pointf2 *impdirfric)
{
	struct pointf2 va,vb,r1p,vd;
	float impfric;
	float dt;
	float chs;
//	float coef=oi->cof;
	float coef=frc;
	if (coef==0) {
		impdirfric->x=0;
		impdirfric->y=0;
		return;
	}
	impdirfric->x=-impdir->y;
	impdirfric->y=impdir->x;
	r1p.x=-r1->y;
	r1p.y=r1->x;
	if (drivemode20==ACCEL && shn==POWERSHOCK) {
		vd.x=-impdirfric->x*accelspin20*WHEELRAD;
		vd.y=-impdirfric->y*accelspin20*WHEELRAD;
	} else {
		vd.x=0;
		vd.y=0;
	}
	va.x=oi->vel.x+oi->velang*r1p.x+vd.x;
	va.y=oi->vel.y+oi->velang*r1p.y+vd.y;
	vb.x=impdirfric->x/oi->mass+r1p.x*cross2d(r1,impdirfric)/oi->moi;
	vb.y=impdirfric->y/oi->mass+r1p.y*cross2d(r1,impdirfric)/oi->moi;
	if (drivemode20==COAST   ||   shn!=POWERSHOCK && drivemode20==ACCEL)
		oi->wheelvel[0]=cross2d(impdir,&va)/WHEELRAD;
	dt=dot2d(&vb,impdirfric);
	if (dt) {
		impfric=-dot2d(&va,impdirfric)/dt; 
		if (impfric>=0)
			chs=1;
		else
			chs=-1;
		if (impfric*chs>coef*contact)
			impfric=chs*coef*contact;
		impdirfric->x*=impfric;
		impdirfric->y*=impfric;
	} else {
		impdirfric->x=0;
		impdirfric->y=0;
	}
}

// given point tp,  returns contact point and unit vector of direction of force of a on b
static int roadcolliding(struct object *ob,struct pointf2 *tp,struct pointf2 *cp,struct pointf2 *imp)
{
	int i,bi=-1;
	int isint=0;
	struct pointf2 ip,bip;
	struct pointf2 *cl;
	struct pointf2 perp,bperp;
	struct pointf2 la,lb;
	struct pointf2 delta;
	float dsq,bdsq;
	float dot1,dot2;
	int startroad,endroad;
	if (ob==NULL) {
		startroad=0;
		endroad=nroad;
	} else {
		startroad=ob->startroad;
		endroad=ob->endroad;
	}
	// first check if close to above or below line segment
	for (i=startroad,cl=road+startroad;i<endroad-1;i++,cl++) {
		perp.y=cl[1].x-cl[0].x;
		perp.x=cl[0].y-cl[1].y;
		if (normalize2d(&perp)) {
			la.x=tp->x+ROADPEN*perp.x;
			la.y=tp->y+ROADPEN*perp.y;
			lb.x=tp->x-ROADPEN*perp.x;
			lb.y=tp->y-ROADPEN*perp.y;
			if (getintersection2d(&la,&lb,&cl[0],&cl[1],&ip)) {
				dsq=dist2dsq(&ip,tp);
				if (bi==-1 || dsq<bdsq) {
					bi=i;
					bdsq=dsq;
					bip=ip;
					bperp=perp;
					isint=1;
				}
			}
		}
	}
	if (bi>=0) { // see if closest one is above or not
		delta.x=bip.x-tp->x;
		delta.y=bip.y-tp->y;
		if (dot2d(&delta,&bperp)<0) // real close and above road, no collision
			return 0;
	}
	for (i=startroad,cl=road+startroad;i<endroad;i++,cl++) {
		dsq=dist2dsq(cl,tp);
		if ((bi==-1 || dsq<bdsq) && dsq<ROADPEN*ROADPEN) {
			bi=i;
			bdsq=dsq;
			bip=*cl;
			isint=0;
		}
	}
	// throw out endpoints
	if (isint==0 && (bi==0 || bi==nroad-1))
		bi=-1;
	// now check if point is above road, if it is then throw it out
	if (bi>=0 && !isint) {
		delta.x=road[bi].x-tp->x;
		delta.y=road[bi].y-tp->y;
		perp.y=road[bi+1].x-road[bi].x;
		perp.x=road[bi].y-road[bi+1].y;
		dot1=dot2d(&delta,&perp);
		perp.y=road[bi].x-road[bi-1].x;
		perp.x=road[bi-1].y-road[bi].y;
		dot2=dot2d(&delta,&perp);
		if (dot1<0 || dot2<0)
			bi=-1;
	}
	if (bi>=0) {
		clipline(B8,ftoix(bip.x),ftoiy(bip.y),ftoix(tp->x),ftoiy(tp->y),lightmagenta);
		if (cp)
			*cp=bip;
		if (imp) {
			imp->x=bip.x-tp->x;
			imp->y=bip.y-tp->y;
			if (normalize2d(imp)>0)
				return 1;
			return 0;
		}
	}
	return 0;
}

static float shockcolliding(struct object *oi,int shn,struct pointf2 *topshock,struct pointf2 *botshock,
							struct pointf2 *colpoint,struct pointf2 *contactforce)
{ // impdircontact is unit force from road, ret value is magnitude
	int i,bi=-1;
	int startroad,endroad;
	struct pointf2 ip,bip;
	float dsq,bdsq;
	float contact;
	float oldshocklen,shockchange;
	struct pointf2 cf;
	struct pointf2 perp,ts;
	// first check if close to above or below line segment
	if (oi==NULL) {
		startroad=0;
		endroad=nroad;
	} else {
		startroad=oi->startroad;
		endroad=oi->endroad;
	}
	oldshocklen=oi->shocklen[shn];
	oi->shocklen[shn]=NORMALSHOCKLEN;
//	oi->wheelvel[shn]=0;
	ts.x=topshock->x+(topshock->x-botshock->x);
	ts.y=topshock->y+(topshock->y-botshock->y);
	for (i=startroad;i<endroad-1;i++) {
		if (getintersection2d(&ts,botshock,&road[i],&road[i+1],&ip)) {
			dsq=dist2dsq(&ip,topshock);
			if (bi==-1 || dsq<bdsq) {
				bi=i;
				bdsq=dsq;
				bip=ip;
			}
		}
	}
	if (bi<0)
		return 0;
	perp.y=road[bi+1].x-road[bi].x;
	perp.x=road[bi].y-road[bi+1].y;
	cf.x=topshock->x-botshock->x;
	cf.y=topshock->y-botshock->y;
	if (dot2d(&perp,&cf)<0)
		return 0;
	*colpoint=bip;
	contact=dist2d(&bip,botshock);
	if (contact>NORMALSHOCKLEN)
		contact=NORMALSHOCKLEN;
	oi->shocklen[shn]=NORMALSHOCKLEN-contact;
	shockchange=oi->shocklen[shn]-oldshocklen;
	contact=contact*shockstr20-shockdamp20*shockchange;
	if (normalize2d(&cf)==0)
		return 0;
	cf.x*=contact;
	cf.y*=contact;
	if (proj2d(&cf,&perp,contactforce)==0)
		return 0;
	contactforce->x*=TINC;
	contactforce->y*=TINC;
	contact=normalize2d(contactforce);
	return contact;

}

static void doroadcollisions()
{
	int i,j;
	struct pointf2 colpoint;
	struct pointf2 prp,prp2;
	struct pointf2 impdir;
	struct pointf2 veldiff;
	struct pointf2 impdircontact,impdirfric;
	struct object *oi;
	struct pointf2 r1;
	struct pointf2 rotvel1;
	struct object t1;
	float contact,contacts;
	for (i=0,oi=objects;i<NOBJECTS;i++,oi++)
		if (oi->mass>0) {
			for (j=0;j<NRECTPOINTS;j++) {
				prp.x=oi->pos.x+oi->pr[j].x;
				prp.y=oi->pos.y+oi->pr[j].y;
				if (roadcolliding(oi,&prp,&colpoint,&impdir)) { // impdir returned is a unit vector
					if (oi->mass) { // keep boxes from overlapping
						oi->pos.x+=impdir.x/8;
						oi->pos.y+=impdir.y/8;
					}
					// draw forces
					clipcircle(B8,ftoix(colpoint.x),ftoiy(colpoint.y),3,red);
					clipline(B8,ftoix(colpoint.x),ftoiy(colpoint.y),
						ftoix(colpoint.x+10*impdir.x),ftoiy(colpoint.y+10*impdir.y),green);
					r1.x=colpoint.x-oi->pos.x;
					r1.y=colpoint.y-oi->pos.y;
					rotvel1.x=-r1.y*oi->velang;
					rotvel1.y=r1.x*oi->velang;
					// velocity of point1 rel to point2
					veldiff.x=oi->vel.x+rotvel1.x;
					veldiff.y=oi->vel.y+rotvel1.y;
					if (dot2d(&impdir,&veldiff)<0) { // only when boxes are moving closer
						contact=collbox2road(oi,&r1,&impdir,&impdircontact); // extend impdir
						// now do friction
						// save oi,and oj
						t1=*oi;
						// do friction on 1/2 of the contact force
						if (t1.mass) {
							t1.vel.x+=impdircontact.x/oi->mass;
							t1.vel.y+=impdircontact.y/oi->mass;
							t1.velang+=cross2d(&r1,&impdircontact)/oi->moi;
						}
//						impdirfric.x=0;
//						impdirfric.y=0;
						fricbox2road(-1,frictother20,&t1,&r1,&impdir,contact*.5f,&impdirfric);
						impdir.x=impdircontact.x+impdirfric.x;
						impdir.y=impdircontact.y+impdirfric.y;
						if (oi->mass) {
							oi->vel.x+=impdir.x/oi->mass;
							oi->vel.y+=impdir.y/oi->mass;
							oi->velang+=cross2d(&r1,&impdir)/oi->moi;
						}
					}
				}
			}
			for (j=0;j<NSHOCKS;j++) {
				if (drivemode20==ACCEL && j==POWERSHOCK)
					oi->wheelvel[j]=accelspin20;
				else
					oi->wheelvel[j]=0;
				prp.x=oi->pos.x+oi->pr[NRECTPOINTS+2*j].x; // top of shock
				prp.y=oi->pos.y+oi->pr[NRECTPOINTS+2*j].y;
				prp2.x=oi->pos.x+oi->pr[NRECTPOINTS+2*j+1].x; // bot of shock
				prp2.y=oi->pos.y+oi->pr[NRECTPOINTS+2*j+1].y;
				if (contacts=shockcolliding(oi,j,&prp,&prp2,&colpoint,&impdir)) { // impdir returned is a unit vector
					if (contacts>0) {
						r1.x=colpoint.x-oi->pos.x;
						r1.y=colpoint.y-oi->pos.y;
						// now do friction, save oi
						t1=*oi;
						// do friction on 1/2 of the contact force
//						if (t1.mass) {
//							t1.vel.x+=impdircontact.x/oi->mass;
//							t1.vel.y+=impdircontact.y/oi->mass;
//							t1.velang+=cross2d(&r1,&impdircontact)/oi->moi;
//						}
						impdircontact.x=impdir.x*contacts;
						impdircontact.y=impdir.y*contacts;
						if (drivemode20==COAST   ||   drivemode20==ACCEL && j!=POWERSHOCK)
							fricbox2road(j,frictshock20,&t1,&r1,&impdir,contacts*.5f,&impdirfric);
						else
							fricbox2road(j,frictother20,&t1,&r1,&impdir,contacts*.5f,&impdirfric);
						oi->wheelvel[j]=t1.wheelvel[0];
						impdir.x=impdircontact.x+impdirfric.x;
						impdir.y=impdircontact.y+impdirfric.y;
						if (oi->mass) {
							oi->vel.x+=impdir.x/oi->mass;
							oi->vel.y+=impdir.y/oi->mass;
							oi->velang+=cross2d(&r1,&impdir)/oi->moi;
						}
					}
				}
			}
		}

}

// run thru all objects finding collisions and dealing with them
static void docollisions()
{
	int i,j;
	struct pointf2 colpoint;
	struct pointf2 impdir;
	struct pointf2 veldiff;
	struct pointf2 impdircontact,impdirfric;
	struct object *oi,*oj;
	struct pointf2 r1,r2;
	struct pointf2 rotvel1,rotvel2;
	struct object t1,t2;
	float contact;
	for (i=0,oi=objects;i<NOBJECTS;i++,oi++)
		for (j=i+1,oj=objects+i+1;j<NOBJECTS;j++,oj++)
			if (oi->mass>0 || oj->mass>0)
				if (bboxinbbox(oi,oj))
					if (colliding(oi,oj,&colpoint,&impdir)) { // impdir returned is a unit vector
						if (oi->mass) { // keep boxes from overlapping
							oi->pos.x-=impdir.x/8;
							oi->pos.y-=impdir.y/8;
						}
						if (oj->mass) {
							oj->pos.x+=impdir.x/8;
							oj->pos.y+=impdir.y/8;
						}
						// draw forces
						clipcircle(B8,ftoix(colpoint.x),ftoiy(colpoint.y),3,red);
						clipline(B8,ftoix(colpoint.x),ftoiy(colpoint.y),
							ftoix(colpoint.x+10*impdir.x),ftoiy(colpoint.y+10*impdir.y),green);
						r1.x=colpoint.x-oi->pos.x;
						r1.y=colpoint.y-oi->pos.y;
						r2.x=colpoint.x-oj->pos.x;
						r2.y=colpoint.y-oj->pos.y;
						rotvel1.x=-r1.y*oi->velang;
						rotvel1.y=r1.x*oi->velang;
						rotvel2.x=-r2.y*oj->velang;
						rotvel2.y=r2.x*oj->velang;
						// velocity of point1 rel to point2
						veldiff.x=(oi->vel.x+rotvel1.x)-(oj->vel.x+rotvel2.x);
						veldiff.y=(oi->vel.y+rotvel1.y)-(oj->vel.y+rotvel2.y);
						if (dot2d(&impdir,&veldiff)>0) { // only when boxes are moving closer
							contact=collbox2box(oi,oj,&r1,&r2,&impdir,&impdircontact); // extend impdir
							// now do friction
							// save oi,and oj
							t1=*oi;
							t2=*oj;
							// do friction on 1/2 of the contact force
							if (t1.mass) {
								t1.vel.x-=impdircontact.x/oi->mass;
								t1.vel.y-=impdircontact.y/oi->mass;
								t1.velang-=cross2d(&r1,&impdircontact)/oi->moi;
							}
							if (t2.mass) {
								t2.vel.x+=impdircontact.x/oj->mass;
								t2.vel.y+=impdircontact.y/oj->mass;
								t2.velang+=cross2d(&r2,&impdircontact)/oj->moi;
							}
							fricbox2box(&t1,&t2,&r1,&r2,&impdir,contact*.5f,&impdirfric);
							impdir.x=impdircontact.x+impdirfric.x;
							impdir.y=impdircontact.y+impdirfric.y;
							if (oi->mass) {
								oi->vel.x-=impdir.x/oi->mass;
								oi->vel.y-=impdir.y/oi->mass;
								oi->velang-=cross2d(&r1,&impdir)/oi->moi;
							}
							if (oj->mass) {
								oj->vel.x+=impdir.x/oj->mass;
								oj->vel.y+=impdir.y/oj->mass;
								oj->velang+=cross2d(&r2,&impdir)/oj->moi;
							}
						}
					}
}

//////////////// drawing
static void drawaxis()
{
	int x,y;
	x=ftoix(0.0f);
	y=ftoiy(0.0f);
	clipline(B8,0,y,WX-1,y,yellow);
	clipline(B8,x,0,x,WY-1,yellow);
}

static void drawgrid()
{
	int x,y;
	float fx,fy;
	fx=0.0f;
	while(1) {
		x=ftoix(fx);
		if (x>=WX)
			break;
		clipline(B8,x,0,x,WY-1,darkgray);
		fx+=view_grid;
	}
	fx=0.0f;
	while(1) {
		x=ftoix(fx);
		if (x<0)
			break;
		clipline(B8,x,0,x,WY-1,darkgray);
		fx-=view_grid;
	}
	fy=0.0f;
	while(1) {
		y=ftoiy(fy);
		if (y<0)
			break;
		clipline(B8,0,y,WX-1,y,darkgray);
		fy+=view_grid;
	}
	fy=0.0f;
	while(1) {
		y=ftoiy(fy);
		if (y>=WY)
			break;
		clipline(B8,0,y,WX-1,y,darkgray);
		fy-=view_grid;
	}
}

static void drawplus(struct bitmap8 *b,int x,int y,int c)
{
	clipline(B8,x-2,y,x+2,y,c);
	clipline(B8,x,y-2,x,y+2,c);
}

static void drawobjects()
{
	int i,j,k;
	struct object *op;
	struct pointf2 wheel;
	int cx,cy;
	struct pointi2 rotrectpnts[NPOINTS];
	for (op=objects,i=0;i<NOBJECTS;i++,op++) {
//		op->shocklen[0]=NORMALSHOCKLEN;
//		op->shocklen[1]=0;
		cx=ftoix(op->pos.x);
		cy=ftoiy(op->pos.y);
		for (j=0;j<NRECTPOINTS;j++) {
			rotrectpnts[j].x=ftoix(op->pos.x+op->pr[j].x);
			rotrectpnts[j].y=ftoiy(op->pos.y+op->pr[j].y);
		}
		clippolyarrayo(B8,rotrectpnts,NRECTPOINTS,op->color);
		for (j=NRECTPOINTS;j<NRECTPOINTS+NSHOCKPOINTS;j++) {
			rotrectpnts[j-NRECTPOINTS].x=ftoix(op->pos.x+op->pr[j].x);
			rotrectpnts[j-NRECTPOINTS].y=ftoiy(op->pos.y+op->pr[j].y);
		}
		for (j=0;j<NSHOCKS;j++) {
			clipline(B8,rotrectpnts[2*j].x,rotrectpnts[2*j].y,
				rotrectpnts[2*j+1].x,rotrectpnts[2*j+1].y,op->color);
			interp2d(&op->pr[NRECTPOINTS+2*j],&op->pr[NRECTPOINTS+2*j+1],
				(op->shocklen[j]-WHEELRAD)/NORMALSHOCKLEN,&wheel);
			clipcircleo(B8,ftoix(op->pos.x+wheel.x),ftoiy(op->pos.y+wheel.y),
				frtoir(WHEELRAD),op->color);
			for (k=0;k<3;k++) {
				clipline(B8,ftoix(op->pos.x+wheel.x),
					ftoiy(op->pos.y+wheel.y),
					ftoix(op->pos.x+wheel.x+WHEELRAD*(float)cos(op->wheelang[j]+k*2*PI/3)),
					ftoiy(op->pos.y+wheel.y+WHEELRAD*(float)sin(op->wheelang[j]+k*2*PI/3)),op->color);
			}
		}	
		if (i==selobject20)
			outtextxybf(B8,cx,cy,white,black,"%2d",i);
		else
			outtextxybf(B8,cx,cy,lightgray,black,"%2d",i);
		drawplus(B8,cx,cy,yellow);
	}
}

static int roadline=-1,roadpoint=-1;
static void drawroad()
{
	int i;
	struct pointf2 *rp;
	for (rp=road,i=0;i<nroad-1;i++,rp++)
		if (roadline==i)
			clipline(B8,ftoix(rp->x),ftoiy(rp->y),ftoix(rp[1].x),ftoiy(rp[1].y),red);
		else
			clipline(B8,ftoix(rp->x),ftoiy(rp->y),ftoix(rp[1].x),ftoiy(rp[1].y),white);
	for (rp=road,i=0;i<nroad;i++,rp++)
		if (roadpoint==i)
			clipcircleo(B8,ftoix(rp->x),ftoiy(rp->y),frtoir(1),red);
		else
			drawplus(B8,ftoix(rp->x),ftoiy(rp->y),white);
}

static void drawstats()
{
	int i;
	float totkinenergy=0,totrotenergy=0,totpotenergy=0;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++) {
		totkinenergy+=op->mass*(op->vel.x*op->vel.x+op->vel.y*op->vel.y)*.5f;
		totrotenergy+=op->moi*op->velang*op->velang*.5f;
		totpotenergy+=op->mass*LITTLEG*op->pos.y;
	}
	outtextxyf(B8,8,WY-16,white,"total KE = %7.3f, total ROTE = %7.3f, total POTE %7.3f, total E = %7.3f\n",
		totkinenergy,totrotenergy,totpotenergy,totkinenergy+totrotenergy+totpotenergy);

}

///////////// extra forces
static void doairfric(float af)
{
	int i;
	struct pointf2 f;
	float fd;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++)
		if (op->mass) {
			fd=((op->vel.x*op->vel.x+op->vel.y*op->vel.y)*af*timeinc20)/op->mass;
			if (fd) {
				f=op->vel;
				if (normalize2d(&f)) {
					f.x*=fd;
					f.y*=fd;
					op->vel.x-=f.x;
					op->vel.y-=f.y;
				}
			}
		}
}

static void	dograv(float g)
{
	int i;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++)
		if (op->mass)
			op->vel.y-=g*timeinc20;
}

static void saveroad()
{
	FILE *fw;
	int i;
	pushandsetdir("user20");
	fw=fopen2("road.txt","w");
	for (i=0;i<nroad;i++)
		fprintf(fw,"%f %f\n",road[i].x,road[i].y);
	fclose(fw);
	popdir();

}

static void loadroad()
{
	char **roadscript;
	int ntoks;
	int i;
	pushandsetdir("user20");
	if (fileexist("road.txt")) {
		roadscript=loadscript("road.txt",&ntoks);
		if (ntoks&1)
			errorexit("road.txt file corrupt");
		nroad=ntoks>>1;
		for (i=0;i<nroad;i++) {
			road[i].x=(float)atof(roadscript[2*i]);
			road[i].y=(float)atof(roadscript[2*i+1]);
		}
		freescript(roadscript,ntoks);
	}
	popdir();
}

// an impulse cursor work with arrow keys;
static void handlecursor()
{
	int i;
	struct pointf2 impulse={0,0};
	int setpos=0,setrot=0,setflip=0;
	float velang=0;
	struct pointf2 rel,la,lb;
	fcursor.x=itofx(MX);
	fcursor.y=itofy(MY);
	drawplus(B8,ftoix(fcursor.x),ftoiy(fcursor.y),yellow);
	roadcolliding(NULL,&fcursor,NULL,NULL);
//	if (KEY=='s') {
//		saveroad();
//	}
	if (!wininfo.indebprint && wininfo.keystate[K_UP])
		drivemode20=ACCEL;
	else if (!wininfo.indebprint && wininfo.keystate[K_DOWN])
		drivemode20=BRAKE;
	else
		drivemode20=COAST;
	if (MBUT==1 && lastmbut==0)
		selobject20=findobject();
	if (selobject20<0) {
		if (lastmbut==0) {
			roadline=-1;
			for (i=0;i<nroad-1;i++) {
				rel.x=road[i+1].y-road[i].y;
				rel.y=road[i].x-road[i+1].x;
				if (normalize2d(&rel)) {
					la.x=fcursor.x+rel.x*2;
					la.y=fcursor.y+rel.y*2;
					lb.x=fcursor.x-rel.x*2;
					lb.y=fcursor.y-rel.y*2;
					if (getintersection2d(&la,&lb,&road[i],&road[i+1],NULL))
						roadline=i;
				}
			}
			roadpoint=-1;
			for (i=0;i<nroad;i++) {
				rel.x=fcursor.x-road[i].x;
				rel.y=fcursor.y-road[i].y;
				if (rel.x*rel.x+rel.y*rel.y<1) {
					roadline=-1;
					roadpoint=i;
				}
			}
		}
		if (MBUT==1) {
			if (roadpoint>=0) { // move point
				road[roadpoint]=fcursor;
			} else if (roadline>=0 && nroad<MAXROAD && lastmbut==0) { // insert point
				for (i=nroad-1;i>roadline;i--)
					road[i+1]=road[i];
				nroad++;
				road[roadline+1]=fcursor;
				roadpoint=roadline+1;
				roadline=-1;
			}
		} else if (MBUT==2 && lastmbut==0) { // delete point
			if (roadpoint>=0 && nroad>2) {
				for (i=roadpoint;i<nroad-1;i++)
					road[i]=road[i+1];
				nroad--;
			}
		}

	}
	if (MX>WX-20)
		view_center20.x+=2;
	if (MX<20)
		view_center20.x-=2;
	if (MY>WY-20)
		view_center20.y-=2;
	if (MY<20)
		view_center20.y+=2;
	if (KEY=='r')
		accelspin20=-accelspin20;
	if (scllock20 && selobject20>=0)
		view_center20=objects[selobject20].pos;
	if (!wininfo.indebprint)
		switch(KEY) {
		case K_RIGHT:
//			impulse.x=impamount;
//			break;
//		case K_LEFT:
//			impulse.x=-impamount;
//			break;
//		case K_UP:
//			impulse.y=impamount;
//			break;
//		case K_DOWN:
//			impulse.y=-impamount;
//			break;
//		case K_E:
//			setrot=1;
//			velang=-TWOPI/64;
//			break;
		case 'l':
			if (scllock20==0 && selobject20<0)
				selobject20=0;
			scllock20^=1;
			break;
		case ' ':
			changestatefunc(user20init);
			break;
//		case K_T:
//			setrot=1;
//			velang=TWOPI/64;
//			break;
		case 'f':
			setflip=1;
			break;
		}
	if (MBUT) {
		setpos=1;
	}
	if (selobject20<0 || selobject20>=NOBJECTS) {
		return;
	}
	if (objects[selobject20].mass==0)
		return;
	if (impulse.x || impulse.y) {
		objects[selobject20].vel.x+=impulse.x/objects[selobject20].mass;
		objects[selobject20].vel.y+=impulse.y/objects[selobject20].mass;
		if (objects[selobject20].moi!=0) {
			rel.x=fcursor.x-objects[selobject20].pos.x;
			rel.y=fcursor.y-objects[selobject20].pos.y;
			objects[selobject20].velang+=cross2d(&rel,&impulse)/objects[selobject20].moi+velang;
		}
	} else if (setrot) {
		objects[selobject20].ang+=velang;
		objects[selobject20].velang=0;
	} else if (setflip) {
		objects[selobject20].ang=0;
		objects[selobject20].velang=0;
	} else if (setpos) {
		scllock20=0;
		objects[selobject20].vel.x=objects[selobject20].vel.y=0;
		objects[selobject20].pos.x=fcursor.x;
		objects[selobject20].pos.y=fcursor.y;
		objects[selobject20].ang=0;
	}
}

/////////////// move
static void updaterots()
{
	int i,j;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++) {
		op->ang=normangrad(op->ang+op->velang*timeinc20);
		for (j=0;j<NSHOCKS;j++) {
			op->wheelang[j]=normangrad(op->wheelang[j]+op->wheelvel[j]*timeinc20);
		}
	}
}

static void updatetrans()
{
	int i;
	struct object *op;
	for (op=objects,i=0;i<NOBJECTS;i++,op++) {
		op->pos.x+=op->vel.x*timeinc20;
		op->pos.y+=op->vel.y*timeinc20;
	}
}

////////////////////////// main
void user20init()
{
	int i;//,cw;
	framecount=0;
//	setupwindow(SX,SY,8);
	video_setupwindow(800,600,8);
	memcpy(objects,iobjects,sizeof(iobjects));
	timeinc20=TINC;
	iterloop20=1;
	wininfo.fpswanted=FPS;

   // Get the default control word.
 //   cw= _controlfp( 0,0 );

   // Set the exception bits ON.
 //  cw &=~(EM_OVERFLOW|EM_ZERODIVIDE|EM_DENORMAL);

   // Set the control word.
 //  _controlfp( cw, MCW_EM );
	loadroad();
	view_center20.x=0;
	view_center20.y=0;
	selobject20=0;
	accelspin20=startaccelspin20;
	for (i=0;i<NOBJECTS;i++) {
		objects[i].startroad=0;
		objects[i].endroad=nroad-1;
	}

}

void user20proc()
{
	int i;
	// draw background
	video_lock();
	cliprect(B8,0,0,WX-1,WY-1,blue);
//	cliprecto(B8,0,0,WX-1,WY-1,white);
	if (zoom20>EPSILON) {
		view_x0=-50.0f/zoom20;
		view_x1=50.0f/zoom20;
		view_y0=-37.5f/zoom20;
		view_y1=37.5f/zoom20;
	}
	drawgrid();
	drawaxis();
	
	// collide objects
	if (iterloop20<0)
		iterloop20=0;
	for (i=0;i<iterloop20;i++) {
		calccollisioninfo(); // bbox , points, moment of interia
		docollisions();			// find intersection, calc impulse, adjust trans and rot velocities
	
		doroadcollisions();
		// move objects
		doairfric(AIRFRIC);
		dograv(LITTLEG);
		updatetrans();
		updaterots();
		framecount++;
	}
	handlecursor();

	// draw objects 
	drawobjects();
	drawroad();
	drawstats();
	outtextxyf(B8,WX/2,WY-30,white,"sel obj %3d, framecount %d",selobject20,framecount);
	video_unlock();
	lastmbut=MBUT;
}

void user20exit()
{
	saveroad();
}

#endif
